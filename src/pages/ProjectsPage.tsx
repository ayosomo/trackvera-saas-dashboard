import { useMemo, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FeedbackMessage } from "../components/FeedbackMessage";
import { SummaryCard } from "../components/SummaryCard";
import {
  filterProjects,
  paginateProjects,
  sortProjects,
  type ProjectListState,
} from "../domain/project";
import { calculateSummary } from "../features/dashboard/summary";
import { getStage } from "../features/orders/orderJourney";
import { ProjectFilters } from "../features/projects/ProjectFilters";
import { ProjectPagination } from "../features/projects/ProjectPagination";
import {
  defaultProjectListState,
  readProjectListState,
  writeProjectListState,
} from "../features/projects/projectListState";
import { ProjectTable } from "../features/projects/ProjectTable";
import { compactCurrencyFormatter, formatLongDate } from "../lib/formatters";
import { useFlowOps } from "../app/FlowOpsContext";

const pageSize = 5;

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function ProjectsPage() {
  const {
    projects,
    isLoading,
    isLoadError,
    loadError,
    refetchProjects,
    feedback,
    dismissFeedback,
    openNewProject,
    openNotifications,
    unreadNotificationCount,
  } = useFlowOps();
  const newProjectButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const listState = useMemo(
    () => readProjectListState(searchParams),
    [searchParams],
  );

  const filteredProjects = useMemo(
    () => filterProjects(projects, listState),
    [listState, projects],
  );
  const sortedProjects = useMemo(
    () => sortProjects(filteredProjects, listState.sort, listState.direction),
    [filteredProjects, listState.direction, listState.sort],
  );
  const pagination = useMemo(
    () => paginateProjects(sortedProjects, listState.page, pageSize),
    [listState.page, sortedProjects],
  );
  const summary = useMemo(() => calculateSummary(projects), [projects]);
  const hasFilters =
    listState.search.trim().length > 0 ||
    listState.status !== "All statuses";

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

  function updateListState(nextState: ProjectListState) {
    setSearchParams(writeProjectListState(nextState));
  }

  return (
    <>
      <header className="page-header" id="overview">
        <div>
          <p className="eyebrow">{formatLongDate(new Date())}</p>
          <h1>Order control tower</h1>
          <p>
            One journey, three supply-chain parties, and no ambiguity about the
            next move.
          </p>
        </div>
        <div className="header-actions">
          <button
            ref={notificationButtonRef}
            type="button"
            className="notification-button"
            onClick={() => openNotifications(notificationButtonRef.current)}
            aria-label={`Open notifications, ${unreadNotificationCount} unread`}
          >
            <span aria-hidden="true">♢</span>
            {unreadNotificationCount > 0 && (
              <strong>{unreadNotificationCount}</strong>
            )}
          </button>
          <button
            ref={newProjectButtonRef}
            type="button"
            className="button button--primary new-project-button"
            onClick={() => openNewProject(newProjectButtonRef.current)}
          >
            <span aria-hidden="true">＋</span>
            New order
          </button>
        </div>
      </header>

      <FeedbackMessage feedback={feedback} onDismiss={dismissFeedback} />

      {isLoading ? (
        <DashboardSkeleton />
      ) : isLoadError ? (
        <div className="query-state" role="alert">
          <span aria-hidden="true">!</span>
          <h2>We couldn’t load the order portfolio</h2>
          <p>{getErrorMessage(loadError)}</p>
          <button
            className="button button--primary"
            type="button"
            onClick={refetchProjects}
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
            <AccountabilityMetric
              tone="msp"
              value={accountability.msp}
              label="MSP action"
            />
            <AccountabilityMetric
              tone="external"
              value={accountability.external}
              label="Partner / supplier"
            />
            <AccountabilityMetric
              tone="customer"
              value={accountability.customer}
              label="Customer action"
            />
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
                URL-backed portfolio view
              </span>
            </div>
            <ProjectFilters
              filters={listState}
              resultCount={filteredProjects.length}
              onChange={updateListState}
            />
            <ProjectTable
              projects={pagination.items}
              hasFilters={hasFilters}
              onClearFilters={() => updateListState(defaultProjectListState)}
              onOpenProject={(project) =>
                navigate(`/projects/${project.id}`, {
                  state: { returnTo: `${location.pathname}${location.search}` },
                })
              }
            />
            <ProjectPagination
              {...pagination}
              onPageChange={(page) =>
                updateListState({ ...listState, page })
              }
            />
          </section>
        </>
      )}
    </>
  );
}

interface AccountabilityMetricProps {
  tone: "msp" | "external" | "customer";
  value: number;
  label: string;
}

function AccountabilityMetric({
  tone,
  value,
  label,
}: AccountabilityMetricProps) {
  return (
    <div>
      <span className={`accountability-dot accountability-dot--${tone}`} />
      <p>
        <strong>{value}</strong>
        {label}
      </p>
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
