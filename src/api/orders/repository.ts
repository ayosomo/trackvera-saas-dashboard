import type { Order, OrderDraft } from "../../types";

export interface ListOrdersOptions {
  signal?: AbortSignal;
}

export interface OrdersRepository {
  list(options?: ListOrdersOptions): Promise<Order[]>;
  create(draft: OrderDraft): Promise<Order>;
  update(order: Order): Promise<Order>;
}

export class OrdersRepositoryError extends Error {
  constructor(
    message: string,
    readonly operation: "list" | "create" | "update",
    readonly status?: number,
  ) {
    super(message);
    this.name = "OrdersRepositoryError";
  }
}
