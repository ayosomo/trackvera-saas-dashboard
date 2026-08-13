import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/errors";
import { createProject, getProjects, updateProject } from "../api/projects";
import type { OrderNotification } from "../features/orders/NotificationCentre";
import {
  advanceOrder,
  getNextStage,
  getStage,
} from "../features/orders/orderJourney";
import type {
  OrderBlocker,
  Project,
  ProjectDraft,
} from "../domain/project";
import { useAuth } from "../security/AuthContext";
import {
  mockIdentities,
  roleLabels,
  type MockIdentity,
} from "../security/permissions";
import {
  TrackveraContext,
  type TrackveraContextValue,
  type TrackveraFeedback,
} from "./TrackveraContext";

const projectsQueryKey = ["projects"] as const;
const NotificationCentre = lazy(() =>
  import("../features/orders/NotificationCentre").then((module) => ({
    default: module.NotificationCentre,
  })),
);
const ProjectModal = lazy(() =>
  import("../features/projects/ProjectModal").then((module) => ({
    default: module.ProjectModal,
  })),
);

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

export function TrackveraShell() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, can, switchIdentity, signOut, expireSession } = useAuth();
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const notificationReturnFocusRef = useRef<HTMLElement | null>(null);
  const previousPathnameRef = useRef(location.pathname);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<OrderNotification[]>(initialNotifications);
  const [feedback, setFeedback] = useState<TrackveraFeedback | null>(null);
  const canCreateProjects = can("project:create");
  const canEditProjects = can("project:edit");
  const canUpdateDelivery = can("delivery:update");

  const handleApiAccessError = useCallback(
    (error: unknown): boolean => {
      if (!(error instanceof ApiError)) return false;

      if (error.status === 401) {
        expireSession();
        return true;
      }

      if (error.status === 403) {
        navigate("/forbidden", {
          replace: true,
          state: { detail: error.message },
        });
        return true;
      }

      return false;
    },
    [expireSession, navigate],
  );

  useEffect(() => {
    if (previousPathnameRef.current === location.pathname) return;

    previousPathnameRef.current = location.pathname;
    window.setTimeout(() => document.getElementById("main-content")?.focus(), 0);
  }, [location.pathname]);

  const projectsQuery = useQuery({
    queryKey: projectsQueryKey,
    queryFn: ({ signal }) => getProjects({ signal }),
  });

  useEffect(() => {
    if (projectsQuery.isError) handleApiAccessError(projectsQuery.error);
  }, [handleApiAccessError, projectsQuery.error, projectsQuery.isError]);

  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );
  const editingProject =
    projects.find((project) => project.id === editingProjectId) ?? null;

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

  function restoreTriggerFocus() {
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }

  const createMutation = useMutation<
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

      queryClient.setQueryData<Project[]>(projectsQueryKey, [
        {
          ...draft,
          id: optimisticId,
          updatedAt: new Date().toISOString(),
        },
        ...previousProjects,
      ]);
      return { previousProjects, optimisticId };
    },
    onError: (_error, _draft, context) => {
      if (context) {
        queryClient.setQueryData(projectsQueryKey, context.previousProjects);
      }
      if (handleApiAccessError(_error)) return;
      setFeedback({
        kind: "error",
        message:
          "The order tracker was not saved. Your existing portfolio is unchanged.",
      });
    },
    onSuccess: (createdProject, _draft, context) => {
      queryClient.setQueryData<Project[]>(projectsQueryKey, (current = []) =>
        current.map((project) =>
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
      setIsCreateModalOpen(false);
      restoreTriggerFocus();
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
      queryClient.setQueryData<Project[]>(projectsQueryKey, (current = []) =>
        current.map((item) => (item.id === project.id ? project : item)),
      );
      return { previousProjects };
    },
    onError: (_error, variables, context) => {
      if (context) {
        queryClient.setQueryData(projectsQueryKey, context.previousProjects);
      }
      if (handleApiAccessError(_error)) return;
      setFeedback({
        kind: "error",
        message:
          variables.errorMessage ??
          "The order update failed and has been rolled back.",
      });
    },
    onSuccess: (savedProject, variables) => {
      queryClient.setQueryData<Project[]>(projectsQueryKey, (current = []) =>
        current.map((item) =>
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
      if (variables.closeEditorOnSuccess) setEditingProjectId(null);
    },
  });

  function closeProjectModal() {
    if (editingProjectId) {
      setEditingProjectId(null);
      return;
    }

    setIsCreateModalOpen(false);
    restoreTriggerFocus();
  }

  function closeNotifications() {
    setIsNotificationsOpen(false);
    window.setTimeout(() => notificationReturnFocusRef.current?.focus(), 0);
  }

  function showForbidden(detail: string) {
    navigate("/forbidden", { state: { detail } });
  }

  function submitProjectEdit(draft: ProjectDraft) {
    if (!canEditProjects) {
      showForbidden("Your role cannot edit commercial project details.");
      return;
    }
    if (!editingProject) return;

    setFeedback(null);
    updateMutation.mutate({
      project: { ...editingProject, ...draft },
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
    if (!canUpdateDelivery) {
      showForbidden("Your role cannot update delivery milestones.");
      return;
    }
    const nextStage = getNextStage(project.currentStage);
    if (!nextStage) return;

    updateMutation.mutate({
      project: advanceOrder(project),
      notification: {
        title: `Milestone reached · ${nextStage.shortLabel}`,
        detail: `${project.customer} moved to ${nextStage.label}. ${nextStage.nextAction}`,
      },
    });
  }

  function addBlocker(project: Project, blocker: OrderBlocker) {
    if (!canUpdateDelivery) {
      showForbidden("Your role cannot manage delivery exceptions.");
      return;
    }
    updateMutation.mutate({
      project: {
        ...project,
        blockers: [blocker, ...project.blockers],
        openRisks: project.openRisks + 1,
        status: ["ECC", "Wayleave", "Survey failure", "Network capacity"].includes(
          blocker.type,
        )
          ? "Blocked"
          : "At risk",
      },
      notification: {
        title: `Exception assigned · ${blocker.type}`,
        detail: `${blocker.accountableParty} is accountable. ${blocker.nextAction}`,
      },
    });
  }

  function resolveBlocker(project: Project, blockerId: string) {
    if (!canUpdateDelivery) {
      showForbidden("Your role cannot resolve delivery exceptions.");
      return;
    }
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

  const openExceptions = projects.reduce(
    (total, project) =>
      total +
      project.blockers.filter((blocker) => blocker.status === "Open").length,
    0,
  );
  const unreadNotificationCount = notifications.filter(
    (item) => item.unread,
  ).length;

  const contextValue: TrackveraContextValue = {
    projects,
    isLoading: projectsQuery.isLoading,
    isLoadError: projectsQuery.isError,
    loadError: projectsQuery.error,
    refetchProjects: () => void projectsQuery.refetch(),
    feedback,
    dismissFeedback: () => setFeedback(null),
    openNewProject: (returnFocusTo) => {
      if (!canCreateProjects) {
        showForbidden("Your role cannot create project trackers.");
        return;
      }
      returnFocusRef.current = returnFocusTo ?? null;
      createMutation.reset();
      setFeedback(null);
      setIsCreateModalOpen(true);
    },
    openProjectEditor: (project) => {
      if (!canEditProjects) {
        showForbidden("Your role cannot edit commercial project details.");
        return;
      }
      updateMutation.reset();
      setFeedback(null);
      setEditingProjectId(project.id);
    },
    openNotifications: (returnFocusTo) => {
      notificationReturnFocusRef.current =
        returnFocusTo ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      setIsNotificationsOpen(true);
    },
    unreadNotificationCount,
    canCreateProjects,
    canEditProjects,
    canUpdateDelivery,
    isUpdating: updateMutation.isPending,
    advanceMilestone,
    addBlocker,
    resolveBlocker,
  };

  if (!user) return null;

  return (
    <TrackveraContext.Provider value={contextValue}>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Sidebar
          projectCount={projects.length}
          openExceptionCount={openExceptions}
          user={user}
          onIdentityChange={switchIdentity}
          onExpireSession={expireSession}
          onSignOut={() => {
            signOut();
            navigate("/sign-in", { replace: true });
          }}
        />
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>

        {(isCreateModalOpen || editingProjectId !== null) && (
          <Suspense fallback={null}>
            <ProjectModal
              isOpen
              mode={editingProjectId ? "edit" : "create"}
              project={editingProject ?? undefined}
              isSubmitting={
                editingProjectId
                  ? updateMutation.isPending
                  : createMutation.isPending
              }
              submitError={
                editingProjectId
                  ? updateMutation.isError
                    ? getErrorMessage(updateMutation.error)
                    : null
                  : createMutation.isError
                    ? getErrorMessage(createMutation.error)
                    : null
              }
              onClose={closeProjectModal}
              onSubmit={
                editingProjectId
                  ? submitProjectEdit
                  : (draft) => {
                      if (!canCreateProjects) {
                        showForbidden("Your role cannot create project trackers.");
                        return;
                      }
                      setFeedback(null);
                      createMutation.mutate(draft);
                    }
              }
            />
          </Suspense>
        )}

        {isNotificationsOpen && (
          <Suspense fallback={null}>
            <NotificationCentre
              isOpen
              notifications={notifications}
              onClose={closeNotifications}
              onMarkAllRead={() =>
                setNotifications((items) =>
                  items.map((item) => ({ ...item, unread: false })),
                )
              }
            />
          </Suspense>
        )}
      </div>
    </TrackveraContext.Provider>
  );
}

interface SidebarProps {
  projectCount: number;
  openExceptionCount: number;
  user: MockIdentity;
  onIdentityChange: (identityId: string) => void;
  onExpireSession: () => void;
  onSignOut: () => void;
}

function Sidebar({
  projectCount,
  openExceptionCount,
  user,
  onIdentityChange,
  onExpireSession,
  onSignOut,
}: SidebarProps) {
  const location = useLocation();
  const isProjectDetail = /^\/projects\/[^/]+$/.test(location.pathname);
  const isExceptionView = new URLSearchParams(location.search).get("status") === "Blocked";

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <Link className="brand" to="/projects" aria-label="Trackvera home">
        <span className="brand__mark" aria-hidden="true">
          F
        </span>
        <span>Trackvera</span>
      </Link>
      <p className="sidebar__workspace-label">MSP Order Control</p>
      <nav>
        <NavItem
          to="/projects"
          icon="⌂"
          isActive={location.pathname === "/projects" && !location.search && !location.hash}
        >
          Control tower
        </NavItem>
        <NavItem
          to="/projects?sort=updatedAt"
          icon="▦"
          count={projectCount}
          isActive={isProjectDetail || (location.pathname === "/projects" && Boolean(location.search) && !isExceptionView)}
        >
          Orders
        </NavItem>
        <NavItem
          to="/projects?status=Blocked&sort=status&direction=asc"
          icon="△"
          count={openExceptionCount}
          isActive={location.pathname === "/projects" && isExceptionView}
        >
          Exceptions
        </NavItem>
        <NavItem
          to="/projects#raci"
          icon="◎"
          isActive={location.pathname === "/projects" && location.hash === "#raci"}
        >
          RACI ownership
        </NavItem>
      </nav>
      <div className="sidebar__footer">
        <div className="team-avatar" aria-hidden="true">
          {user.name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </div>
        <div>
          <strong>{user.name}</strong>
          <span>{roleLabels[user.role]}</span>
        </div>
        <details className="session-menu">
          <summary aria-label="Security demo options">···</summary>
          <div className="session-menu__panel">
            <p className="eyebrow">Security demo</p>
            <label>
              <span>Active identity</span>
              <select
                aria-label="Active demo identity"
                value={user.id}
                onChange={(event) => onIdentityChange(event.target.value)}
              >
                {mockIdentities.map((identity) => (
                  <option value={identity.id} key={identity.id}>
                    {identity.name} · {roleLabels[identity.role]}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={onExpireSession}>
              Expire session
            </button>
            <button type="button" onClick={onSignOut}>
              Log out
            </button>
          </div>
        </details>
      </div>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  icon: string;
  count?: number;
  isActive: boolean;
  children: ReactNode;
}

function NavItem({ to, icon, count, isActive, children }: NavItemProps) {
  return (
    <Link
      className={isActive ? "nav-link nav-link--active" : "nav-link"}
      to={to}
      aria-current={isActive ? "page" : undefined}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
      {count !== undefined && <span className="nav-link__count">{count}</span>}
    </Link>
  );
}
