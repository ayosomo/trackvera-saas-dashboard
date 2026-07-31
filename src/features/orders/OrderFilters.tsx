import { orderStatuses, type OrderFilters } from "../../types";

interface OrderFiltersProps {
  filters: OrderFilters;
  resultCount: number;
  onChange: (filters: OrderFilters) => void;
}

export function OrderFilters({
  filters,
  resultCount,
  onChange,
}: OrderFiltersProps) {
  return (
    <div className="order-filters" aria-label="Order filters">
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
              status: event.target.value as OrderFilters["status"],
            })
          }
        >
          <option>All statuses</option>
          {orderStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>

      <p className="order-filters__count" aria-live="polite">
        {resultCount} {resultCount === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}
