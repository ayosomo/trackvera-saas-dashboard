import { projectStatuses, type ProjectFilters } from "../../types";

interface ProjectFiltersProps {
  filters: ProjectFilters;
  resultCount: number;
  onChange: (filters: ProjectFilters) => void;
}

export function ProjectFilters({
  filters,
  resultCount,
  onChange,
}: ProjectFiltersProps) {
  return (
    <div className="project-filters" aria-label="Project filters">
      <label className="search-field">
        <span className="sr-only">Search orders</span>
        <span aria-hidden="true" className="search-field__icon">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search customer, reference, supplier or owner…"
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
        />
      </label>

      <label className="status-filter">
        <span className="sr-only">Filter by status</span>
        <select
          value={filters.status}
          onChange={(event) =>
            onChange({
              ...filters,
              status: event.target.value as ProjectFilters["status"],
            })
          }
        >
          <option>All statuses</option>
          {projectStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>

      <p className="project-filters__count" aria-live="polite">
        {resultCount} {resultCount === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}
