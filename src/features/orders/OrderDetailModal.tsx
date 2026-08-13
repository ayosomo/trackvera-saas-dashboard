import { useState, type FormEvent } from "react";
import { formatDate } from "../../lib/formatters";
import {
  blockerTypes,
  type BlockerType,
  type OrderBlocker,
  type Project,
} from "../../domain/project";
import { StatusBadge } from "../../components/StatusBadge";
import {
  blockerPlaybooks,
  getNextStage,
  getStage,
  getStageIndex,
  orderJourney,
} from "./orderJourney";

interface OrderDetailViewProps {
  project: Project;
  canEdit: boolean;
  canUpdateDelivery: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onAdvance: (project: Project) => void;
  onAddBlocker: (project: Project, blocker: OrderBlocker) => void;
  onResolveBlocker: (project: Project, blockerId: string) => void;
}

export function OrderDetailView({
  project,
  canEdit,
  canUpdateDelivery,
  isUpdating,
  onClose,
  onEdit,
  onAdvance,
  onAddBlocker,
  onResolveBlocker,
}: OrderDetailViewProps) {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [blockerType, setBlockerType] = useState<BlockerType>("ECC");
  const [summary, setSummary] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const currentStage = getStage(project.currentStage);
  const currentStageIndex = getStageIndex(project.currentStage);
  const nextStage = getNextStage(project.currentStage);
  const openBlockers = project.blockers.filter(
    (blocker) => blocker.status === "Open",
  );
  const hasBlockingIssue = openBlockers.length > 0;

  function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!summary.trim() || !targetDate) return;
    const playbook = blockerPlaybooks[blockerType];

    onAddBlocker(project, {
      id: `blocker-${Date.now()}`,
      type: blockerType,
      summary: summary.trim(),
      status: "Open",
      accountableParty: playbook.accountableParty,
      resolverRole: playbook.resolverRole,
      nextAction: playbook.nextAction,
      targetDate,
    });
    setSummary("");
    setTargetDate("");
    setShowIssueForm(false);
  }

  return (
    <div className="project-detail-page">
      <section
        className="tracker-modal tracker-page"
        aria-labelledby="tracker-title"
      >
        <header className="tracker-header">
          <div>
            <p className="eyebrow">Order control · {project.id}</p>
            <div className="tracker-title-row">
              <h1 id="tracker-title">{project.customer}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p>
              {project.name} · {project.product}
            </p>
          </div>
          <div className="tracker-header__actions">
            {canEdit && (
              <button
                type="button"
                className="button button--secondary button--small"
                onClick={() => onEdit(project)}
                disabled={isUpdating}
              >
                Edit details
              </button>
            )}
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={onClose}
              disabled={isUpdating}
            >
              ← Back to orders
            </button>
          </div>
        </header>

        <div className="tracker-meta">
          <div>
            <span>Order owner</span>
            <strong>{project.owner}</strong>
          </div>
          <div>
            <span>Target live</span>
            <strong>{formatDate(project.dueDate)}</strong>
          </div>
          <div>
            <span>CRF</span>
            <strong>{project.crfReference || "Pending"}</strong>
          </div>
          <div>
            <span>{project.thirdParty}</span>
            <strong>{project.thirdPartyReference || "Pending"}</strong>
          </div>
          <div>
            <span>{project.supplier}</span>
            <strong>{project.supplierReference || "Pending"}</strong>
          </div>
        </div>

        <div className="tracker-content">
          <div className="tracker-main">
            <section className="tracker-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">End-to-end journey</p>
                  <h2>Order milestones</h2>
                </div>
                <span>
                  Stage {currentStageIndex + 1} of {orderJourney.length}
                </span>
              </div>

              <ol className="journey-list">
                {orderJourney.map((stage, index) => {
                  const state =
                    index < currentStageIndex
                      ? "complete"
                      : index === currentStageIndex
                        ? "current"
                        : "upcoming";
                  return (
                    <li className={`journey-step journey-step--${state}`} key={stage.id}>
                      <span className="journey-step__marker" aria-hidden="true">
                        {state === "complete" ? "✓" : index + 1}
                      </span>
                      <div>
                        <div className="journey-step__title">
                          <strong>{stage.label}</strong>
                          {state === "current" && <span>Current</span>}
                        </div>
                        <p>{stage.description}</p>
                        {state === "current" && (
                          <div className="current-stage-action">
                            <span>Next action</span>
                            <strong>{stage.nextAction}</strong>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="tracker-section" id="exceptions">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Delay control</p>
                  <h2>Exceptions and playbooks</h2>
                </div>
                {canUpdateDelivery && (
                  <button
                    className="button button--secondary button--small"
                    type="button"
                    onClick={() => setShowIssueForm((value) => !value)}
                  >
                    {showIssueForm ? "Cancel" : "＋ Log issue"}
                  </button>
                )}
              </div>

              {canUpdateDelivery && showIssueForm && (
                <form className="issue-form" onSubmit={submitIssue}>
                  <label>
                    <span>Issue type</span>
                    <select
                      value={blockerType}
                      onChange={(event) =>
                        setBlockerType(event.target.value as BlockerType)
                      }
                    >
                      {blockerTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="issue-form__summary">
                    <span>What is holding the order?</span>
                    <input
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    <span>Next checkpoint</span>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(event) => setTargetDate(event.target.value)}
                      required
                    />
                  </label>
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={isUpdating}
                  >
                    Add with playbook
                  </button>
                </form>
              )}

              {openBlockers.length === 0 ? (
                <div className="all-clear">
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>No open exceptions</strong>
                    <p>This order can move to its next milestone.</p>
                  </div>
                </div>
              ) : (
                <div className="blocker-list">
                  {openBlockers.map((blocker) => (
                    <article className="blocker-card" key={blocker.id}>
                      <div className="blocker-card__top">
                        <span className="blocker-card__type">{blocker.type}</span>
                        <span>Checkpoint {formatDate(blocker.targetDate)}</span>
                      </div>
                      <h3>{blocker.summary}</h3>
                      <dl>
                        <div>
                          <dt>Accountable</dt>
                          <dd>{blocker.accountableParty}</dd>
                        </div>
                        <div>
                          <dt>Resolver</dt>
                          <dd>{blocker.resolverRole}</dd>
                        </div>
                      </dl>
                      <div className="playbook-action">
                        <span>Coordinator’s next move</span>
                        <p>{blocker.nextAction}</p>
                      </div>
                      {canUpdateDelivery && (
                        <button
                          type="button"
                          className="resolve-button"
                          onClick={() => onResolveBlocker(project, blocker.id)}
                          disabled={isUpdating}
                        >
                          ✓ Mark resolved
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="raci-panel" id="raci">
            <p className="eyebrow">Current-stage RACI</p>
            <h2>Who owns what?</h2>
            <p className="raci-panel__intro">{currentStage.label}</p>
            <dl className="raci-list">
              <div className="raci-row raci-row--responsible">
                <dt>
                  <span>R</span>
                  Responsible
                </dt>
                <dd>{currentStage.responsible}</dd>
              </div>
              <div className="raci-row raci-row--accountable">
                <dt>
                  <span>A</span>
                  Accountable
                </dt>
                <dd>{currentStage.accountable}</dd>
              </div>
              <div className="raci-row raci-row--consulted">
                <dt>
                  <span>C</span>
                  Consulted
                </dt>
                <dd>{currentStage.consulted}</dd>
              </div>
              <div className="raci-row raci-row--informed">
                <dt>
                  <span>I</span>
                  Informed
                </dt>
                <dd>{currentStage.informed}</dd>
              </div>
            </dl>

            <div className="accountability-callout">
              <span>Accountability now</span>
              <strong>{currentStage.accountable}</strong>
              <p>
                FlowOps keeps {project.owner} responsible for orchestration
                while clearly showing which party must unblock the outcome.
              </p>
            </div>

            {canUpdateDelivery ? (
              <button
                type="button"
                className="button button--primary advance-button"
                onClick={() => onAdvance(project)}
                disabled={isUpdating || hasBlockingIssue || !nextStage}
              >
                {isUpdating
                  ? "Updating…"
                  : nextStage
                    ? `Complete milestone → ${nextStage.shortLabel}`
                    : "Journey complete"}
              </button>
            ) : (
              <p className="permission-notice">
                Read-only access · delivery updates require an operational role.
              </p>
            )}
            {canUpdateDelivery && hasBlockingIssue && (
              <p className="advance-help">
                Resolve open exceptions before completing this milestone.
              </p>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
