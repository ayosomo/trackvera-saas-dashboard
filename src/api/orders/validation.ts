import {
  blockerTypes,
  orderPriorities,
  orderStageIds,
  orderStatuses,
  type BlockerType,
  type Order,
  type OrderBlocker,
  type OrderParty,
  type OrderPriority,
  type OrderStageId,
  type OrderStatus,
} from "../../types";

const blockerStatuses = ["Open", "Resolved"] as const;
const orderParties: readonly OrderParty[] = [
  "MSP",
  "Customer",
  "Third-party partner",
  "Supplier",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  value: Record<string, unknown>,
  key: string,
  path: string,
): string {
  const candidate = value[key];
  if (typeof candidate !== "string") {
    throw new Error(`${path}.${key} must be a string.`);
  }
  return candidate;
}

function requiredNumber(
  value: Record<string, unknown>,
  key: string,
  path: string,
): number {
  const candidate = value[key];
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    throw new Error(`${path}.${key} must be a finite number.`);
  }
  return candidate;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${path} contains an unsupported value.`);
  }
  return value as T;
}

function parseBlocker(value: unknown, path: string): OrderBlocker {
  if (!isRecord(value)) throw new Error(`${path} must be an object.`);

  return {
    id: requiredString(value, "id", path),
    type: enumValue<BlockerType>(value.type, blockerTypes, `${path}.type`),
    summary: requiredString(value, "summary", path),
    status: enumValue(value.status, blockerStatuses, `${path}.status`),
    accountableParty: enumValue(
      value.accountableParty,
      orderParties,
      `${path}.accountableParty`,
    ),
    resolverRole: requiredString(value, "resolverRole", path),
    nextAction: requiredString(value, "nextAction", path),
    targetDate: requiredString(value, "targetDate", path),
  };
}

export function parseOrder(value: unknown, path = "order"): Order {
  if (!isRecord(value)) throw new Error(`${path} must be an object.`);
  if (!Array.isArray(value.blockers)) {
    throw new Error(`${path}.blockers must be an array.`);
  }

  const progress = requiredNumber(value, "progress", path);
  const openRisks = requiredNumber(value, "openRisks", path);
  const monthlyValue = requiredNumber(value, "monthlyValue", path);

  if (progress < 0 || progress > 100) {
    throw new Error(`${path}.progress must be between 0 and 100.`);
  }
  if (!Number.isInteger(openRisks) || openRisks < 0) {
    throw new Error(`${path}.openRisks must be a non-negative integer.`);
  }
  if (monthlyValue < 0) {
    throw new Error(`${path}.monthlyValue must be non-negative.`);
  }

  return {
    id: requiredString(value, "id", path),
    customer: requiredString(value, "customer", path),
    name: requiredString(value, "name", path),
    product: requiredString(value, "product", path),
    site: requiredString(value, "site", path),
    owner: requiredString(value, "owner", path),
    salesOwner: requiredString(value, "salesOwner", path),
    thirdParty: requiredString(value, "thirdParty", path),
    supplier: requiredString(value, "supplier", path),
    crfReference: requiredString(value, "crfReference", path),
    thirdPartyReference: requiredString(value, "thirdPartyReference", path),
    supplierReference: requiredString(value, "supplierReference", path),
    status: enumValue<OrderStatus>(value.status, orderStatuses, `${path}.status`),
    priority: enumValue<OrderPriority>(
      value.priority,
      orderPriorities,
      `${path}.priority`,
    ),
    progress,
    currentStage: enumValue<OrderStageId>(
      value.currentStage,
      orderStageIds,
      `${path}.currentStage`,
    ),
    dueDate: requiredString(value, "dueDate", path),
    openRisks,
    blockers: value.blockers.map((blocker, index) =>
      parseBlocker(blocker, `${path}.blockers[${index}]`),
    ),
    monthlyValue,
    updatedAt: requiredString(value, "updatedAt", path),
  };
}

export function parseOrders(value: unknown): Order[] {
  if (!Array.isArray(value)) throw new Error("orders must be an array.");
  return value.map((order, index) => parseOrder(order, `orders[${index}]`));
}
