import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  createProject,
  getProjects,
  updateProject,
} from "./api/projects";
import { FeedbackMessage } from "./components/FeedbackMessage";
import { SummaryCard } from "./components/SummaryCard";
import { calculateSummary } from "./features/dashboard/summary";
import {
  NotificationCentre,
  type OrderNotification,
} from "./features/orders/NotificationCentre";
import { OrderDetailModal } from "./features/orders/OrderDetailModal";
import {
  advanceOrder,
  getNextStage,
  getStage,
} from "./features/orders/orderJourney";
import { ProjectFilters } from "./features/projects/ProjectFilters";
import { ProjectModal } from "./features/projects/ProjectModal";
import { ProjectTable } from "./features/projects/ProjectTable";
import {
  compactCurrencyFormatter,
  formatLongDate,
} from "./lib/formatters";
import type {
  OrderBlocker,
  Project,
  ProjectDraft,
  ProjectFilters as Filters,
} from "./types";

const projectsQueryKey = ["projects"] as const;
const initialFilters: Filters = { search: "", status: "All statuses" };

interface MutationContext {
  previousProjects: Project[];
  optimisticId?: string;
}

interface UpdateVariables {
  project: Project;
  notification: {
    title: string;
    detail: string;
  };
  successMessage?: string;
  errorMessage?: string;
  closeEditorOnSuccess?: boolean;
}

const initialNotifications: OrderNotification[] = [
  {
    id: "notification-1",
    owner: "Rowan Bell",
    title: "Milestone reached · Activation",
    detail: "Fieldwork Energy moved into activation and service testing.",
    timestamp: "Today, 08:30",
    unread: true,
  },
  {
    id: "notification-2",
    owner: "Theo Grant",
    title: "Exception assigned · ECC",
    detail:
      "Veridian Bank requires customer approval for £8,400 construction charges.",
    timestamp: "Today, 09:15",
    unread: true,
  },
  {
    id: "notification-3",
    owner: "Maya Chen",
    title: "Milestone reached · Handover",
    detail: "CivicWorks completed service handover and moved into support.",
    timestamp: "18 Jul, 17:00",
    unread: false,
  },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function App() {
  const queryClient = useQueryClient();
  const newProjectButtonRef = useRef<HTMLButtonElement>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<OrderNotification[]>(initialNotifications);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const projectsQuery = useQuery({
    queryKey: projectsQueryKey,
    queryFn: ({ signal }) => getProjects({ signal }),
  });

  const projectMutation = useMutation<
    Project,
    Error,
    ProjectDraft,
    MutationContext
  >({
    mutationFn: createProject,
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previousProjects =
        queryClient.getQueryData<Project[]>(projectsQueryKey) ?? [];
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticProject: Project = {
        ...draft,
        id: optimisticId,
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Project[]>(projectsQueryKey, [
        optimisticProject,
        ...previousProjects,
      ]);
      return { previousProjects, optimisticId };
    },
    onError: (_error, _draft, context) => {
      if (context) {
        queryClient.setQueryData(projectsQueryKey, context.previousProjects);
      }
      setFeedback({
        kind: "error",
        message:
          "The order tracker was not saved. Your existing portfolio is unchanged.",
      });
    },
    onSuccess: (createdProject, _draft, context) => {
      queryClient.setQueryData<Project[]>(projectsQueryKey, (projects = []) =>
        projects.map((project) =>
          project.id === context?.optimisticId ? createdProject : project,
        ),
      );
      addNotification(
        createdProject.owner,
        "New order tracker assigned",
        `${createdProject.customer} was created at ${getStage(createdProject.currentStage).label}.`,
      );
      setFeedback({
        kind: "success",
        message: `${createdProject.customer} tracker is ready and ${createdProject.owner} was notified.`,
      });
      closeModal();
    },
  });

  const updateMutation = useMutation<
    Project,
    Error,
    UpdateVariables,
    MutationContext
  >({
    mutationFn: ({ project }) => updateProject(project),
    onMutate: async ({ project }) => {
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previousProjects =
        queryClient.getQueryData<Project[]>(projectsQueryKey) ?? [];
      queryClient.setQueryData<Project[]>(projectsQueryKey, (projects = []) =>
        projects.map((item) => (item.id === project.id ? project : item)),
      );
      return { previousProjects };
    },
    onError: (_error, variables, context) => {
      if (context) {
        queryClient.setQueryData(projectsQueryKey, context.previousProjects);
      }
      setFeedback({
        kind: "error",
        message:
          variables.errorMessage ??
          "The order update failed and has been rolled back.",
      });
    },
    onSuccess: (savedProject, variables) => {
      queryClient.setQueryData<Project[]>(projectsQueryKey, (projects = []) =>
        projects.map((item) =>
          item.id === savedProject.id ? savedProject : item,
        ),
      );
      addNotification(
        savedProject.owner,
        variables.notification.title,
        variables.notification.detail,
      );
      setFeedback({
        kind: "success",
        message:
          variables.successMessage ??
          `${savedProject.owner} was notified of the order update.`,
      });
      if (variables.closeEditorOnSuccess) {
        setEditingProjectId(null);
        setSelectedProjectId(savedProject.id);
      }
    },
  });

  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );
  const summary = useMemo(() => calculateSummary(projects), [projects]);
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;
  const editingProject =
    projects.find((project) => project.id === editingProjectId) ?? null;

  const filteredProjects = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase();
    return projects.filter((project) => {
      const matchesStatus =
        filters.status === "All statuses" || project.status === filters.status;
      const matchesSearch =
        !search ||
        [
          project.customer,
          project.name,
          project.product,
          project.site,
          project.owner,
          project.salesOwner,
          project.thirdParty,
          project.supplier,
          project.crfReference,
          project.thirdPartyReference,
          project.supplierReference,
        ].some((value) => value.toLocaleLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [filters, projects]);

  const accountability = useMemo(() => {
    const active = projects.filter((project) => project.status !== "Complete");
    return {
      msp: active.filter(
        (project) => getStage(project.currentStage).accountable === "MSP",
      ).length,
      external: active.filter((project) =>
        ["Third-party partner", "Supplier"].includes(
          getStage(project.currentStage).accountable,
        ),
      ).length,
      customer: active.filter(
        (project) => getStage(project.currentStage).accountable === "Customer",
      ).length,
    };
  }, [projects]);

  const openExceptions = projects.reduce(
    (total, project) =>
      total +
      project.blockers.filter((blocker) => blocker.status === "Open").length,
    0,
  );

  function addNotification(owner: string, title: string, detail: string) {
    setNotifications((current) => [
      {
        id: `notification-${Date.now()}`,
        owner,
        title,
        detail,
        timestamp: "Just now",
        unread: true,
      },
      ...current,
    ]);
  }

  function openModal() {
    projectMutation.reset();
    setEditingProjectId(null);
    setFeedback(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (editingProjectId) {
      const projectId = editingProjectId;
      setEditingProjectId(null);
      setSelectedProjectId(projectId);
      return;
    }

    setIsModalOpen(false);
    window.setTimeout(() => newProjectButtonRef.current?.focus(), 0);
  }

  function submitProject(draft: ProjectDraft) {
    setFeedback(null);
    projectMutation.mutate(draft);
  }

  function openProjectEditor(project: Project) {
    updateMutation.reset();
    setFeedback(null);
    setSelectedProjectId(null);
    setEditingProjectId(project.id);
  }

  function submitProjectEdit(draft: ProjectDraft) {
    if (!editingProject) return;

    setFeedback(null);
    updateMutation.mutate({
      project: {
        ...editingProject,
        ...draft,
      },
      notification: {
        title: "Project details updated",
        detail: `${draft.customer} commercial and delivery details were updated.`,
      },
      successMessage: `${draft.customer} was updated successfully.`,
      errorMessage: "The project changes failed and have been rolled back.",
      closeEditorOnSuccess: true,
    });
  }

  function advanceMilestone(project: Project) {
    const nextStage = getNextStage(project.currentStage);
    if (!nextStage) return;
    const updated = advanceOrder(project);
    updateMutation.mutate({
      project: updated,
      notification: {
        title: `Milestone reached · ${nextStage.shortLabel}`,
        detail: `${project.customer} moved to ${nextStage.label}. ${nextStage.nextAction}`,
      },
    });
  }

  function addBlocker(project: Project, blocker: OrderBlocker) {
    const updated: Project = {
      ...project,
      blockers: [blocker, ...project.blockers],
      openRisks: project.openRisks + 1,
      status: ["ECC", "Wayleave", "Survey failure", "Network capacity"].includes(
        blocker.type,
      )
        ? "Blocked"
        : "At risk",
    };
    updateMutation.mutate({
      project: updated,
      notification: {
        title: `Exception assigned · ${blocker.type}`,
        detail: `${blocker.accountableParty} is accountable. ${blocker.nextAction}`,
      },
    });
  }

  function resolveBlocker(project: Project, blockerId: string) {
    const blockers = project.blockers.map((blocker) =>
      blocker.id === blockerId
        ? ({ ...blocker, status: "Resolved" } as const)
        : blocker,
    );
    const remaining = blockers.filter(
      (blocker) => blocker.status === "Open",
    ).length;
    const resolved = project.blockers.find(
      (blocker) => blocker.id === blockerId,
    );
    updateMutation.mutate({
      project: {
        ...project,
        blockers,
        openRisks: remaining,
        status: remaining === 0 ? "On track" : project.status,
      },
      notification: {
        title: `Exception resolved · ${resolved?.type ?? "Order issue"}`,
        detail: `${project.customer} can continue through ${getStage(project.currentStage).label}.`,
      },
    });
  }

  const hasFilters =
    filters.search.trim().length > 0 || filters.status !== "All statuses";
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="sidebar" aria-label="Primary navigation">
        <a className="brand" href="/" aria-label="FlowOps home">
          <span className="brand__mark" aria-hidden="true">
            F
          </span>
          <span>FlowOps</span>
        </a>
        <p className="sidebar__workspace-label">MSP Order Control</p>
        <nav>
          <a className="nav-link nav-link--active" href="#overview">
            <span aria-hidden="true">⌂</span>
            Control tower
          </a>
          <a className="nav-link" href="#orders">
            <span aria-hidden="true">▦</span>
            Orders
            <span className="nav-link__count">{projects.length}</span>
          </a>
          <a className="nav-link" href="#exceptions">
            <span aria-hidden="true">△</span>
            Exceptions
            <span className="nav-link__count">{openExceptions}</span>
          </a>
          <a className="nav-link" href="#raci">
            <span aria-hidden="true">◎</span>
            RACI ownership
          </a>
        </nav>
        <div className="sidebar__footer">
          <div className="team-avatar" aria-hidden="true">
            DO
          </div>
          <div>
            <strong>Delivery Ops</strong>
            <span>Order coordination</span>
          </div>
          <button type="button" aria-label="Workspace options">
            ···
          </button>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1}>
        <header className="page-header" id="overview">
          <div>
            <p className="eyebrow">{formatLongDate(new Date())}</p>
            <h1>Order control tower</h1>
            <p>
              One journey, three supply-chain parties, and no ambiguity about
              the next move.
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="notification-button"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label={`Open notifications, ${unreadCount} unread`}
            >
              <span aria-hidden="true">♢</span>
              {unreadCount > 0 && <strong>{unreadCount}</strong>}
            </button>
            <button
              ref={newProjectButtonRef}
              type="button"
              className="button button--primary new-project-button"
              onClick={openModal}
            >
              <span aria-hidden="true">＋</span>
              New order
            </button>
          </div>
        </header>

        <FeedbackMessage
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />

        {projectsQuery.isLoading ? (
          <DashboardSkeleton />
        ) : projectsQuery.isError ? (
          <div className="query-state" role="alert">
            <span aria-hidden="true">!</span>
            <h2>We couldn’t load the order portfolio</h2>
            <p>{getErrorMessage(projectsQuery.error)}</p>
            <button
              className="button button--primary"
              type="button"
              onClick={() => void projectsQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <section className="summary-grid" aria-label="Order summary">
              <SummaryCard
                label="Active orders"
                value={summary.activeProjects}
                detail={`${projects.filter((project) => project.status === "On track").length} currently on track`}
                icon="▦"
                tone="ink"
              />
              <SummaryCard
                label="Need attention"
                value={summary.atRiskProjects}
                detail="At risk or blocked"
                icon="△"
                tone="amber"
              />
              <SummaryCard
                label="Open exceptions"
                value={openExceptions}
                detail="With an assigned playbook"
                icon="!"
                tone="blue"
              />
              <SummaryCard
                label="Recurring value"
                value={compactCurrencyFormatter.format(summary.monthlyValue)}
                detail="Active monthly value"
                icon="£"
                tone="green"
              />
            </section>

            <section
              className="accountability-strip"
              aria-label="Current accountability"
              id="raci"
            >
              <div className="accountability-strip__title">
                <span>RACI now</span>
                <strong>Who must move the order forward?</strong>
              </div>
              <div>
                <span className="accountability-dot accountability-dot--msp" />
                <p>
                  <strong>{accountability.msp}</strong>
                  MSP action
                </p>
              </div>
              <div>
                <span className="accountability-dot accountability-dot--external" />
                <p>
                  <strong>{accountability.external}</strong>
                  Partner / supplier
                </p>
              </div>
              <div>
                <span className="accountability-dot accountability-dot--customer" />
                <p>
                  <strong>{accountability.customer}</strong>
                  Customer action
                </p>
              </div>
              <p className="accountability-strip__note">
                Order owners remain responsible for orchestration; accountability
                follows the milestone and issue playbook.
              </p>
            </section>

            <section className="projects-panel" id="orders">
              <div className="projects-panel__heading">
                <div>
                  <p className="eyebrow">End-to-end fulfilment</p>
                  <h2>Managed service orders</h2>
                </div>
                <span className="live-indicator">
                  <span aria-hidden="true" />
                  Live accountability
                </span>
              </div>
              <ProjectFilters
                filters={filters}
                resultCount={filteredProjects.length}
                onChange={setFilters}
              />
              <ProjectTable
                projects={filteredProjects}
                hasFilters={hasFilters}
                onClearFilters={() => setFilters(initialFilters)}
                onOpenProject={(project) => setSelectedProjectId(project.id)}
              />
            </section>
          </>
        )}
      </main>

      <ProjectModal
        isOpen={isModalOpen || editingProjectId !== null}
        mode={editingProjectId ? "edit" : "create"}
        project={editingProject ?? undefined}
        isSubmitting={
          editingProjectId ? updateMutation.isPending : projectMutation.isPending
        }
        submitError={
          editingProjectId
            ? updateMutation.isError
              ? getErrorMessage(updateMutation.error)
              : null
            : projectMutation.isError
              ? getErrorMessage(projectMutation.error)
              : null
        }
        onClose={closeModal}
        onSubmit={editingProjectId ? submitProjectEdit : submitProject}
      />

      <OrderDetailModal
        project={selectedProject}
        isUpdating={updateMutation.isPending}
        onClose={() => setSelectedProjectId(null)}
        onEdit={openProjectEditor}
        onAdvance={advanceMilestone}
        onAddBlocker={addBlocker}
        onResolveBlocker={resolveBlocker}
      />

      <NotificationCentre
        isOpen={isNotificationsOpen}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() =>
          setNotifications((items) =>
            items.map((item) => ({ ...item, unread: false })),
          )
        }
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="skeleton-summary">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
      <div className="skeleton-table">
        <div />
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}
