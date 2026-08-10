import {
  projectStatuses,
  type ProjectListState,
} from "../../domain/project";

interface ProjectFiltersProps {
  filters: ProjectListState;
  resultCount: number;
  onChange: (filters: ProjectListState) => void;
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
            onChange({ ...filters, search: event.target.value, page: 1 })
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
              status: event.target.value as ProjectListState["status"],
              page: 1,
            })
          }
        >
          <option>All statuses</option>
          {projectStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>

      <label className="sort-filter">
        <span className="sr-only">Sort orders by</span>
        <select
          value={filters.sort}
          onChange={(event) =>
            onChange({
              ...filters,
              sort: event.target.value as ProjectListState["sort"],
              page: 1,
            })
          }
        >
          <option value="updatedAt">Recently updated</option>
          <option value="customer">Customer</option>
          <option value="dueDate">Target live date</option>
          <option value="monthlyValue">Monthly value</option>
          <option value="status">Delivery health</option>
        </select>
      </label>

      <button
        className="sort-direction"
        type="button"
        onClick={() =>
          onChange({
            ...filters,
            direction: filters.direction === "asc" ? "desc" : "asc",
            page: 1,
          })
        }
        aria-label={`Sort ${filters.direction === "asc" ? "descending" : "ascending"}`}
      >
        {filters.direction === "asc" ? "↑" : "↓"}
      </button>

      <p className="project-filters__count" aria-live="polite">
        {resultCount} {resultCount === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}
