import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "../../lib/formatters";
import {
  blockerTypes,
  type BlockerType,
  type OrderBlocker,
  type Project,
} from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import {
  blockerPlaybooks,
  getNextStage,
  getStage,
  getStageIndex,
  orderJourney,
} from "./orderJourney";

interface OrderDetailModalProps {
  project: Project | null;
  isUpdating: boolean;
  onClose: () => void;
  onAdvance: (project: Project) => void;
  onAddBlocker: (project: Project, blocker: OrderBlocker) => void;
  onResolveBlocker: (project: Project, blockerId: string) => void;
}

export function OrderDetailModal({
  project,
  isUpdating,
  onClose,
  onAdvance,
  onAddBlocker,
  onResolveBlocker,
}: OrderDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [blockerType, setBlockerType] = useState<BlockerType>("ECC");
  const [summary, setSummary] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    if (!project) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [project]);

  if (!project) return null;

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

    onAddBlocker(project!, {
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

  return createPortal(
    <div
      className="modal-backdrop tracker-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isUpdating) onClose();
      }}
    >
      <section
        className="tracker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracker-title"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !isUpdating) onClose();
        }}
      >
        <header className="tracker-header">
          <div>
            <p className="eyebrow">Order control · {project.id}</p>
            <div className="tracker-title-row">
              <h2 id="tracker-title">{project.customer}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p>
              {project.name} · {project.product}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal__close"
            onClick={onClose}
            disabled={isUpdating}
            aria-label="Close order tracker"
          >
            ×
          </button>
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
                  <h3>Order milestones</h3>
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
                  <h3>Exceptions and playbooks</h3>
                </div>
                <button
                  className="button button--secondary button--small"
                  type="button"
                  onClick={() => setShowIssueForm((value) => !value)}
                >
                  {showIssueForm ? "Cancel" : "＋ Log issue"}
                </button>
              </div>

              {showIssueForm && (
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
                      <h4>{blocker.summary}</h4>
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
                      <button
                        type="button"
                        className="resolve-button"
                        onClick={() => onResolveBlocker(project, blocker.id)}
                        disabled={isUpdating}
                      >
                        ✓ Mark resolved
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="raci-panel" id="raci">
            <p className="eyebrow">Current-stage RACI</p>
            <h3>Who owns what?</h3>
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
            {hasBlockingIssue && (
              <p className="advance-help">
                Resolve open exceptions before completing this milestone.
              </p>
            )}
          </aside>
        </div>
      </section>
    </div>,
    document.body,
  );
}
