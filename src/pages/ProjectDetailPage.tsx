import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FeedbackMessage } from "../components/FeedbackMessage";
import { OrderDetailView } from "../features/orders/OrderDetailModal";
import { useFlowOps } from "../app/FlowOpsContext";

interface DetailLocationState {
  returnTo?: string;
}

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    projects,
    isLoading,
    isLoadError,
    loadError,
    refetchProjects,
    feedback,
    dismissFeedback,
    openProjectEditor,
    canEditProjects,
    canUpdateDelivery,
    isUpdating,
    advanceMilestone,
    addBlocker,
    resolveBlocker,
  } = useFlowOps();
  const project = projects.find((item) => item.id === projectId);
  const returnTo =
    (location.state as DetailLocationState | null)?.returnTo ?? "/projects";

  if (isLoading) {
    return (
      <div className="detail-loading" aria-busy="true">
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (isLoadError) {
    return (
      <div className="route-state" role="alert">
        <span className="route-state__code">Service unavailable</span>
        <h1>We couldn’t load this project</h1>
        <p>
          {loadError instanceof Error
            ? loadError.message
            : "The order service did not return a usable response."}
        </p>
        <button
          className="button button--primary"
          type="button"
          onClick={refetchProjects}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="route-state">
        <span className="route-state__code">Project not found</span>
        <h1>This order tracker doesn’t exist</h1>
        <p>
          The link may be out of date, or the project may have been removed
          from this portfolio.
        </p>
        <button
          className="button button--primary"
          type="button"
          onClick={() => navigate(returnTo)}
        >
          Return to orders
        </button>
      </div>
    );
  }

  return (
    <>
      <FeedbackMessage feedback={feedback} onDismiss={dismissFeedback} />
      <OrderDetailView
        project={project}
        canEdit={canEditProjects}
        canUpdateDelivery={canUpdateDelivery}
        isUpdating={isUpdating}
        onClose={() => navigate(returnTo)}
        onEdit={openProjectEditor}
        onAdvance={advanceMilestone}
        onAddBlocker={addBlocker}
        onResolveBlocker={resolveBlocker}
      />
    </>
  );
}
