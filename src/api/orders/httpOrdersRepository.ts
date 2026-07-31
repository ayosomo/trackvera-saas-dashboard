import type { Order, OrderDraft } from "../../types";
import {
  OrdersRepositoryError,
  type ListOrdersOptions,
  type OrdersRepository,
} from "./repository";
import { parseOrder, parseOrders } from "./validation";

async function readResponse(response: Response, operation: "list" | "create" | "update") {
  if (!response.ok) {
    throw new OrdersRepositoryError(
      `The order service returned ${response.status}. Please try again.`,
      operation,
      response.status,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new OrdersRepositoryError(
      "The order service returned unreadable data.",
      operation,
      response.status,
    );
  }
}

function validated<T>(operation: "list" | "create" | "update", parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown validation error.";
    throw new OrdersRepositoryError(
      `The order service returned invalid data: ${detail}`,
      operation,
    );
  }
}

export class HttpOrdersRepository implements OrdersRepository {
  constructor(private readonly baseUrl: string) {}

  async list(options: ListOrdersOptions = {}): Promise<Order[]> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
    const value = await readResponse(response, "list");
    return validated("list", () => parseOrders(value));
  }

  async create(draft: OrderDraft): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });
    const value = await readResponse(response, "create");
    return validated("create", () => parseOrder(value));
  }

  async update(order: Order): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${order.id}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });
    const value = await readResponse(response, "update");
    return validated("update", () => parseOrder(value));
  }
}
