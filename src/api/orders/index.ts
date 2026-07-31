import type { Order, OrderDraft } from "../../types";
import { DemoOrdersRepository } from "./demoOrdersRepository";
import { HttpOrdersRepository } from "./httpOrdersRepository";
import type { ListOrdersOptions, OrdersRepository } from "./repository";

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
}

function createRepository(): OrdersRepository {
  const apiBaseUrl = getApiBaseUrl();
  return apiBaseUrl
    ? new HttpOrdersRepository(apiBaseUrl)
    : new DemoOrdersRepository();
}

export const ordersRepository = createRepository();

export function getOrders(options?: ListOrdersOptions): Promise<Order[]> {
  return ordersRepository.list(options);
}

export function createOrder(draft: OrderDraft): Promise<Order> {
  return ordersRepository.create(draft);
}

export function updateOrder(order: Order): Promise<Order> {
  return ordersRepository.update(order);
}

export { DemoOrdersRepository } from "./demoOrdersRepository";
export { HttpOrdersRepository } from "./httpOrdersRepository";
export { OrdersRepositoryError } from "./repository";
export { parseOrder, parseOrders } from "./validation";
export type { ListOrdersOptions, OrdersRepository } from "./repository";
