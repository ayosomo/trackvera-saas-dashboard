import type { OrderStatus } from "../types";

interface StatusBadgeProps {
  status: OrderStatus;
}

const statusClasses: Record<OrderStatus, string> = {
  "On track": "status-badge--on-track",
  "At risk": "status-badge--at-risk",
  Blocked: "status-badge--blocked",
  Complete: "status-badge--complete",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${statusClasses[status]}`}>
      <span aria-hidden="true" className="status-badge__dot" />
      {status}
    </span>
  );
}
