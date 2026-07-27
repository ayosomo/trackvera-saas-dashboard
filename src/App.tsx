import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { createProject, getProjects } from "./api/projects";
import { FeedbackMessage } from "./components/FeedbackMessage";
import { SummaryCard } from "./components/SummaryCard";
import { calculateSummary } from "./features/dashboard/summary";
import { ProjectFilters } from "./features/projects/ProjectFilters";
import { ProjectModal } from "./features/projects/ProjectModal";
import { ProjectTable } from "./features/projects/ProjectTable";
import {
  compactCurrencyFormatter,
  formatLongDate,
} from "./lib/formatters";
import type { Project, ProjectDraft, ProjectFilters as Filters } from "./types";

const projectsQueryKey = ["projects"] as const;
const initialFilters: Filters = { search: "", status: "All statuses" };

interface MutationContext {
  previousProjects: Project[];
  optimisticId: string;
}

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
        message: "The project was not saved. Your existing data is unchanged.",
      });
    },
    onSuccess: (createdProject, _draft, context) => {
      queryClient.setQueryData<Project[]>(projectsQueryKey, (projects = []) =>
        projects.map((project) =>
          project.id === context?.optimisticId ? createdProject : project,
        ),
      );
      setFeedback({
        kind: "success",
        message: `${createdProject.customer} was added successfully.`,
      });
      closeModal();
    },
  });

  const projects = useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );
  const summary = useMemo(() => calculateSummary(projects), [projects]);
  const filteredProjects = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        filters.status === "All statuses" || project.status === filters.status;
      const matchesSearch =
        !search ||
        [project.customer, project.name, project.owner].some((value) =>
          value.toLocaleLowerCase().includes(search),
        );

      return matchesStatus && matchesSearch;
    });
  }, [filters, projects]);

  function openModal() {
    projectMutation.reset();
    setFeedback(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    window.setTimeout(() => newProjectButtonRef.current?.focus(), 0);
  }

  function submitProject(draft: ProjectDraft) {
    setFeedback(null);
    projectMutation.mutate(draft);
  }

  const hasFilters =
    filters.search.trim().length > 0 || filters.status !== "All statuses";

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
        <nav>
          <a className="nav-link nav-link--active" href="#overview">
            <span aria-hidden="true">⌂</span>
            Overview
          </a>
          <a className="nav-link" href="#projects">
            <span aria-hidden="true">▦</span>
            Projects
            <span className="nav-link__count">{projects.length}</span>
          </a>
          <a className="nav-link" href="#risks">
            <span aria-hidden="true">△</span>
            Risks
            <span className="nav-link__count">{summary.atRiskProjects}</span>
          </a>
          <a className="nav-link" href="#team">
            <span aria-hidden="true">♙</span>
            Team
          </a>
        </nav>
        <div className="sidebar__footer">
          <div className="team-avatar" aria-hidden="true">
            DO
          </div>
          <div>
            <strong>Delivery Ops</strong>
            <span>Workspace</span>
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
            <h1>Delivery overview</h1>
            <p>Keep implementation momentum visible and risks actionable.</p>
          </div>
          <button
            ref={newProjectButtonRef}
            type="button"
            className="button button--primary new-project-button"
            onClick={openModal}
          >
            <span aria-hidden="true">＋</span>
            New project
          </button>
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
            <h2>We couldn’t load the dashboard</h2>
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
            <section className="summary-grid" aria-label="Delivery summary">
              <SummaryCard
                label="Active projects"
                value={summary.activeProjects}
                detail={`${projects.filter((project) => project.status === "On track").length} currently on track`}
                icon="▦"
                tone="ink"
              />
              <SummaryCard
                label="Delivery attention"
                value={summary.atRiskProjects}
                detail="At risk or blocked"
                icon="△"
                tone="amber"
              />
              <SummaryCard
                label="Due in 30 days"
                value={summary.dueSoon}
                detail="Upcoming milestones"
                icon="◷"
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

            <section className="projects-panel" id="projects">
              <div className="projects-panel__heading">
                <div>
                  <p className="eyebrow">Implementation portfolio</p>
                  <h2>Customer projects</h2>
                </div>
                <span className="live-indicator">
                  <span aria-hidden="true" />
                  Live portfolio
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
              />
            </section>
          </>
        )}
      </main>

      <ProjectModal
        isOpen={isModalOpen}
        isSubmitting={projectMutation.isPending}
        submitError={
          projectMutation.isError
            ? getErrorMessage(projectMutation.error)
            : null
        }
        onClose={closeModal}
        onSubmit={submitProject}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-label="Loading dashboard">
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
