import { describe, expect, it } from "vitest";
import { sampleOrders } from "../../test/fixtures";
import { calculateSummary } from "./summary";

describe("calculateSummary", () => {
  it("summarises active delivery health and recurring value", () => {
    const summary = calculateSummary(
      sampleOrders,
      new Date("2026-07-27T09:00:00.000Z"),
    );

    expect(summary).toEqual({
      activeOrders: 2,
      atRiskOrders: 1,
      dueSoon: 2,
      monthlyValue: 51150,
    });
  });

  it("returns zero values for an empty portfolio", () => {
    expect(calculateSummary([])).toEqual({
      activeOrders: 0,
      atRiskOrders: 0,
      dueSoon: 0,
      monthlyValue: 0,
    });
  });
});
