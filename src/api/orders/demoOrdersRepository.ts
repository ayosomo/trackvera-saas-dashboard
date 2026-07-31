import type { Order, OrderDraft } from "../../types";
import {
  OrdersRepositoryError,
  type ListOrdersOptions,
  type OrdersRepository,
} from "./repository";
import { parseOrder, parseOrders } from "./validation";

const STORAGE_KEY = "flowops-orders";
const LEGACY_STORAGE_KEY = "flowops-created-orders";

function createId(): string {
  if ("randomUUID" in crypto) return crypto.randomUUID();
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readSavedOrders(): Order[] {
  const value =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!value) return [];

  try {
    return parseOrders(JSON.parse(value));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown validation error.";
    throw new OrdersRepositoryError(
      `Saved browser data is invalid: ${detail}`,
      "list",
    );
  }
}

function saveOrder(order: Order, operation: "create" | "update"): void {
  const orders = readSavedOrders();
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([order, ...orders.filter((item) => item.id !== order.id)]),
    );
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    throw new OrdersRepositoryError(
      "The order could not be saved in this browser.",
      operation,
    );
  }
}

export class DemoOrdersRepository implements OrdersRepository {
  async list(options: ListOrdersOptions = {}): Promise<Order[]> {
    const response = await fetch("/orders.json", {
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
    if (!response.ok) {
      throw new OrdersRepositoryError(
        `The demo data returned ${response.status}. Please try again.`,
        "list",
        response.status,
      );
    }

    let seedValue: unknown;
    try {
      seedValue = await response.json();
    } catch {
      throw new OrdersRepositoryError("The demo data is unreadable.", "list");
    }

    let seedOrders: Order[];
    try {
      seedOrders = parseOrders(seedValue);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown validation error.";
      throw new OrdersRepositoryError(`The demo data is invalid: ${detail}`, "list");
    }

    const savedOrders = readSavedOrders();
    const savedIds = new Set(savedOrders.map((order) => order.id));
    return [
      ...savedOrders,
      ...seedOrders.filter((order) => !savedIds.has(order.id)),
    ];
  }

  async create(draft: OrderDraft): Promise<Order> {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    const order = parseOrder({
      ...draft,
      id: createId(),
      updatedAt: new Date().toISOString(),
    });
    saveOrder(order, "create");
    return order;
  }

  async update(order: Order): Promise<Order> {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const updatedOrder = parseOrder({
      ...order,
      updatedAt: new Date().toISOString(),
    });
    saveOrder(updatedOrder, "update");
    return updatedOrder;
  }
}
