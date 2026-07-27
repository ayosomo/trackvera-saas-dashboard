import { StatusBadge } from "../../components/StatusBadge";
import { currencyFormatter, formatDate } from "../../lib/formatters";
import type { Project } from "../../types";

interface ProjectTableProps {
  projects: Project[];
  hasFilters: boolean;
  onClearFilters: () => void;
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
}: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon" aria-hidden="true">
          ◇
        </span>
        <h3>{hasFilters ? "No matching projects" : "No projects yet"}</h3>
        <p>
          {hasFilters
            ? "Try a different search or clear the active filters."
            : "Create a project to start tracking delivery progress."}
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
      <table className="project-table">
        <caption className="sr-only">
          Customer implementation projects and delivery health
        </caption>
        <thead>
          <tr>
            <th scope="col">Customer &amp; project</th>
            <th scope="col">Owner</th>
            <th scope="col">Status</th>
            <th scope="col">Progress</th>
            <th scope="col">Due date</th>
            <th scope="col">Risks</th>
            <th scope="col">Monthly value</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td data-label="Project">
                <div className="project-name">
                  <span
                    className={`priority-dot priority-dot--${project.priority.toLowerCase()}`}
                    aria-label={`${project.priority} priority`}
                  />
                  <div>
                    <strong>{project.customer}</strong>
                    <span>{project.name}</span>
                  </div>
                </div>
              </td>
              <td data-label="Owner">
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
              <td data-label="Status">
                <StatusBadge status={project.status} />
              </td>
              <td data-label="Progress">
                <div className="progress-cell">
                  <progress
                    value={project.progress}
                    max={100}
                    aria-label={`${project.customer} progress`}
                  >
                    {project.progress}%
                  </progress>
                  <span>{project.progress}%</span>
                </div>
              </td>
              <td
                data-label="Due date"
                className={dueDateTone(project)}
              >
                {formatDate(project.dueDate)}
              </td>
              <td data-label="Open risks">
                <span
                  className={
                    project.openRisks > 0
                      ? "risk-count risk-count--open"
                      : "risk-count"
                  }
                >
                  {project.openRisks}
                </span>
              </td>
              <td data-label="Monthly value">
                <strong>{currencyFormatter.format(project.monthlyValue)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
