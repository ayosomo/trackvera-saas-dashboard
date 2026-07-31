import type { Order } from "../../types";

export interface DashboardSummary {
  activeOrders: number;
  atRiskOrders: number;
  dueSoon: number;
  monthlyValue: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function calculateSummary(
  orders: Order[],
  now = new Date(),
): DashboardSummary {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dueSoonLimit = today.getTime() + 30 * DAY_IN_MS;
  const activeOrders = orders.filter(
    (order) => order.status !== "Complete",
  );

  return {
    activeOrders: activeOrders.length,
    atRiskOrders: activeOrders.filter(
      (order) => order.status === "At risk" || order.status === "Blocked",
    ).length,
    dueSoon: activeOrders.filter((order) => {
      const dueTime = new Date(`${order.dueDate}T00:00:00`).getTime();
      return dueTime >= today.getTime() && dueTime <= dueSoonLimit;
    }).length,
    monthlyValue: activeOrders.reduce(
      (total, order) => total + order.monthlyValue,
      0,
    ),
  };
}
