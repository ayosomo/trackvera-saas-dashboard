import { StatusBadge } from "../../components/StatusBadge";
import {
  getStage,
  getStageIndex,
  orderJourney,
} from "../orders/orderJourney";
import { formatDate } from "../../lib/formatters";
import type { Project } from "../../types";

interface ProjectTableProps {
  projects: Project[];
  hasFilters: boolean;
  onClearFilters: () => void;
  onOpenProject: (project: Project) => void;
}

function dueDateTone(project: Project): string {
  if (project.status === "Complete") return "";

  const daysUntilDue = Math.ceil(
    (new Date(`${project.dueDate}T00:00:00`).getTime() - Date.now()) /
      (24 * 60 * 60 * 1000),
  );

  return daysUntilDue <= 14 ? "project-table__due--soon" : "";
}

export function ProjectTable({
  projects,
  hasFilters,
  onClearFilters,
  onOpenProject,
}: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon" aria-hidden="true">
          ◇
        </span>
        <h3>{hasFilters ? "No matching orders" : "No orders yet"}</h3>
        <p>
          {hasFilters
            ? "Try a different search or clear the active filters."
            : "Create an order to start its delivery tracker."}
        </p>
        {hasFilters && (
          <button className="button button--secondary" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="project-table order-table">
        <caption className="sr-only">
          Managed service orders, delivery milestones, accountability, and
          exceptions
        </caption>
        <thead>
          <tr>
            <th scope="col">Customer &amp; service</th>
            <th scope="col">Order owner</th>
            <th scope="col">Current milestone</th>
            <th scope="col">Accountable now</th>
            <th scope="col">Health</th>
            <th scope="col">Target live</th>
            <th scope="col">Exceptions</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const stage = getStage(project.currentStage);
            const stageNumber = getStageIndex(project.currentStage) + 1;
            const openBlockers = project.blockers.filter(
              (blocker) => blocker.status === "Open",
            );

            return (
              <tr key={project.id}>
                <td data-label="Order">
                  <div className="project-name">
                    <span
                      className={`priority-dot priority-dot--${project.priority.toLowerCase()}`}
                      aria-label={`${project.priority} priority`}
                    />
                    <div>
                      <strong>{project.customer}</strong>
                      <span>{project.name}</span>
                      <small>{project.product}</small>
                    </div>
                  </div>
                </td>
                <td data-label="Order owner">
                  <div className="owner">
                    <span className="owner__avatar" aria-hidden="true">
                      {project.owner
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>{project.owner}</span>
                  </div>
                </td>
                <td data-label="Current milestone">
                  <div className="stage-cell">
                    <span>
                      {stageNumber}/{orderJourney.length}
                    </span>
                    <div>
                      <strong>{stage.shortLabel}</strong>
                      <progress
                        value={stageNumber}
                        max={orderJourney.length}
                        aria-label={`${project.customer} order progress`}
                      >
                        {stageNumber} of {orderJourney.length}
                      </progress>
                    </div>
                  </div>
                </td>
                <td data-label="Accountable now">
                  <span
                    className={`party-chip party-chip--${stage.accountable
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {stage.accountable}
                  </span>
                </td>
                <td data-label="Health">
                  <StatusBadge status={project.status} />
                </td>
                <td
                  data-label="Target live"
                  className={dueDateTone(project)}
                >
                  {formatDate(project.dueDate)}
                </td>
                <td data-label="Exceptions">
                  {openBlockers.length > 0 ? (
                    <span className="exception-count">
                      {openBlockers.length}
                      <span className="sr-only"> open</span>
                    </span>
                  ) : (
                    <span className="exception-clear">Clear</span>
                  )}
                </td>
                <td data-label="Action">
                  <button
                    className="table-action"
                    type="button"
                    onClick={() => onOpenProject(project)}
                    aria-label={`Open ${project.customer} order tracker`}
                  >
                    Open tracker
                    <span aria-hidden="true">→</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
