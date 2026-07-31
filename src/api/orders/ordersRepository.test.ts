import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleOrders } from "../../test/fixtures";
import type { Order, OrderDraft } from "../../types";
import { DemoOrdersRepository } from "./demoOrdersRepository";
import { HttpOrdersRepository } from "./httpOrdersRepository";
import { parseOrder, parseOrders } from "./validation";

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toDraft(order: Order): OrderDraft {
  return Object.fromEntries(
    Object.entries(order).filter(([key]) => !["id", "updatedAt"].includes(key)),
  ) as OrderDraft;
}

describe("order validation", () => {
  it("accepts the documented order contract", () => {
    expect(parseOrders(sampleOrders)).toEqual(sampleOrders);
  });

  it("rejects malformed enum and nested blocker data", () => {
    expect(() =>
      parseOrder({ ...sampleOrders[0], status: "Almost done" }),
    ).toThrow(/status contains an unsupported value/i);
    expect(() =>
      parseOrder({ ...sampleOrders[0], blockers: [{ id: "broken" }] }),
    ).toThrow(/blockers\[0\]\.type/i);
  });
});

describe("order repositories", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("reads and validates orders from the HTTP adapter", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sampleOrders));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new HttpOrdersRepository("https://api.example.test");

    await expect(repository.list()).resolves.toEqual(sampleOrders);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/orders",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("turns malformed HTTP data into a controlled repository error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse([{ id: "incomplete" }])),
    );
    const repository = new HttpOrdersRepository("https://api.example.test");

    await expect(repository.list()).rejects.toThrow(/returned invalid data/i);
  });

  it("sends validated create and update requests through the HTTP adapter", async () => {
    const order = sampleOrders[0]!;
    const draft = toDraft(order);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(order, 201))
      .mockResolvedValueOnce(jsonResponse(order));
    vi.stubGlobal("fetch", fetchMock);
    const repository = new HttpOrdersRepository("https://api.example.test");

    await expect(repository.create(draft)).resolves.toEqual(order);
    await expect(repository.update(order)).resolves.toEqual(order);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/orders",
      expect.objectContaining({ method: "POST", body: JSON.stringify(draft) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/orders/${order.id}`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(order) }),
    );
  });

  it("preserves HTTP status context in service errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));
    const repository = new HttpOrdersRepository("https://api.example.test");

    await expect(repository.list()).rejects.toMatchObject({
      operation: "list",
      status: 503,
    });
  });

  it("reports corrupt browser storage instead of crashing", async () => {
    window.localStorage.setItem("flowops-orders", "not-json");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(sampleOrders)));

    await expect(new DemoOrdersRepository().list()).rejects.toThrow(
      /saved browser data is invalid/i,
    );
  });

  it("merges, creates, and updates validated demo orders", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(sampleOrders)));
    const repository = new DemoOrdersRepository();
    const source = sampleOrders[0]!;
    const draft = toDraft(source);

    await expect(repository.list()).resolves.toEqual(sampleOrders);

    const createPromise = repository.create({
      ...draft,
      customer: "Atlas Labs",
    });
    await vi.runAllTimersAsync();
    const created = await createPromise;
    expect(created.customer).toBe("Atlas Labs");
    expect(created.id).toEqual(expect.any(String));
    expect(created.id).not.toBe(source.id);

    const updatePromise = repository.update({
      ...created,
      status: "At risk",
    });
    await vi.runAllTimersAsync();
    await expect(updatePromise).resolves.toMatchObject({
      id: created.id,
      status: "At risk",
    });
    expect(JSON.parse(window.localStorage.getItem("flowops-orders") ?? "[]"))
      .toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id })]));
    vi.useRealTimers();
  });
});
