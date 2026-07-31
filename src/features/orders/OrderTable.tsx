import { StatusBadge } from "../../components/StatusBadge";
import {
  getStage,
  getStageIndex,
  orderJourney,
} from "./orderJourney";
import { formatDate } from "../../lib/formatters";
import type { Order } from "../../types";

interface OrderTableProps {
  orders: Order[];
  hasFilters: boolean;
  onClearFilters: () => void;
  onOpenOrder: (order: Order) => void;
}

function dueDateTone(order: Order): string {
  if (order.status === "Complete") return "";

  const daysUntilDue = Math.ceil(
    (new Date(`${order.dueDate}T00:00:00`).getTime() - Date.now()) /
      (24 * 60 * 60 * 1000),
  );

  return daysUntilDue <= 14 ? "order-table__due--soon" : "";
}

export function OrderTable({
  orders,
  hasFilters,
  onClearFilters,
  onOpenOrder,
}: OrderTableProps) {
  if (orders.length === 0) {
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
      <table className="order-table order-table">
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
          {orders.map((order) => {
            const stage = getStage(order.currentStage);
            const stageNumber = getStageIndex(order.currentStage) + 1;
            const openBlockers = order.blockers.filter(
              (blocker) => blocker.status === "Open",
            );

            return (
              <tr key={order.id}>
                <td data-label="Order">
                  <div className="order-name">
                    <span
                      className={`priority-dot priority-dot--${order.priority.toLowerCase()}`}
                      aria-label={`${order.priority} priority`}
                    />
                    <div>
                      <strong>{order.customer}</strong>
                      <span>{order.name}</span>
                      <small>{order.product}</small>
                    </div>
                  </div>
                </td>
                <td data-label="Order owner">
                  <div className="owner">
                    <span className="owner__avatar" aria-hidden="true">
                      {order.owner
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>{order.owner}</span>
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
                        aria-label={`${order.customer} order progress`}
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
                  <StatusBadge status={order.status} />
                </td>
                <td
                  data-label="Target live"
                  className={dueDateTone(order)}
                >
                  {formatDate(order.dueDate)}
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
                    onClick={() => onOpenOrder(order)}
                    aria-label={`Open ${order.customer} order tracker`}
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
