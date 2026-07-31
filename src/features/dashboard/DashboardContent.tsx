import { SummaryCard } from "../../components/SummaryCard";
import { compactCurrencyFormatter } from "../../lib/formatters";
import type { Order, OrderFilters as Filters } from "../../types";
import { OrderFilters } from "../orders/OrderFilters";
import { OrderTable } from "../orders/OrderTable";
import { calculateSummary } from "./summary";
import {
  calculateAccountability,
  countOnTrackOrders,
  countOpenExceptions,
} from "./selectors";

interface DashboardContentProps {
  orders: Order[];
  filteredOrders: Order[];
  filters: Filters;
  hasFilters: boolean;
  updatedAt: number;
  isRefreshing: boolean;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  onOpenOrder: (order: Order) => void;
  onRefresh: () => void;
}

function formatUpdatedTime(updatedAt: number): string {
  if (!updatedAt) return "Not updated yet";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(updatedAt));
}

export function DashboardContent({
  orders,
  filteredOrders,
  filters,
  hasFilters,
  updatedAt,
  isRefreshing,
  onFiltersChange,
  onClearFilters,
  onOpenOrder,
  onRefresh,
}: DashboardContentProps) {
  const summary = calculateSummary(orders);
  const accountability = calculateAccountability(orders);
  const openExceptions = countOpenExceptions(orders);

  return (
    <>
      <section className="summary-grid" aria-label="Order summary">
        <SummaryCard
          label="Active orders"
          value={summary.activeOrders}
          detail={`${countOnTrackOrders(orders)} currently on track`}
          icon="◇"
          tone="ink"
        />
        <SummaryCard
          label="Need attention"
          value={summary.atRiskOrders}
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
        <div>
          <span className="accountability-dot accountability-dot--msp" />
          <p><strong>{accountability.msp}</strong>MSP action</p>
        </div>
        <div>
          <span className="accountability-dot accountability-dot--external" />
          <p><strong>{accountability.external}</strong>Partner / supplier</p>
        </div>
        <div>
          <span className="accountability-dot accountability-dot--customer" />
          <p><strong>{accountability.customer}</strong>Customer action</p>
        </div>
        <p className="accountability-strip__note">
          Order owners remain responsible for orchestration; accountability
          follows the milestone and issue playbook.
        </p>
      </section>

      <section className="orders-panel" id="orders">
        <div className="orders-panel__heading">
          <div>
            <p className="eyebrow">End-to-end fulfilment</p>
            <h2>Managed service orders</h2>
          </div>
          <div className="data-freshness" aria-live="polite">
            <span>Updated {formatUpdatedTime(updatedAt)}</span>
            <button
              className="button button--secondary button--refresh"
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        <OrderFilters
          filters={filters}
          resultCount={filteredOrders.length}
          onChange={onFiltersChange}
        />
        <OrderTable
          orders={filteredOrders}
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
          onOpenOrder={onOpenOrder}
        />
      </section>
    </>
  );
}
