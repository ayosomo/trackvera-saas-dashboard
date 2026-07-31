import { getStage } from "../orders/orderJourney";
import type { Order, OrderFilters } from "../../types";

export const initialOrderFilters: OrderFilters = {
  search: "",
  status: "All statuses",
};

export interface AccountabilitySummary {
  msp: number;
  external: number;
  customer: number;
}

export function filterOrders(orders: Order[], filters: OrderFilters): Order[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return orders.filter((order) => {
    const matchesStatus =
      filters.status === "All statuses" || order.status === filters.status;
    const matchesSearch =
      !search ||
      [
        order.customer,
        order.name,
        order.product,
        order.site,
        order.owner,
        order.salesOwner,
        order.thirdParty,
        order.supplier,
        order.crfReference,
        order.thirdPartyReference,
        order.supplierReference,
      ].some((value) => value.toLocaleLowerCase().includes(search));

    return matchesStatus && matchesSearch;
  });
}

export function calculateAccountability(orders: Order[]): AccountabilitySummary {
  const activeOrders = orders.filter((order) => order.status !== "Complete");

  return {
    msp: activeOrders.filter(
      (order) => getStage(order.currentStage).accountable === "MSP",
    ).length,
    external: activeOrders.filter((order) =>
      ["Third-party partner", "Supplier"].includes(
        getStage(order.currentStage).accountable,
      ),
    ).length,
    customer: activeOrders.filter(
      (order) => getStage(order.currentStage).accountable === "Customer",
    ).length,
  };
}

export function countOpenExceptions(orders: Order[]): number {
  return orders.reduce(
    (total, order) =>
      total + order.blockers.filter((blocker) => blocker.status === "Open").length,
    0,
  );
}

export function countOnTrackOrders(orders: Order[]): number {
  return orders.filter((order) => order.status === "On track").length;
}
