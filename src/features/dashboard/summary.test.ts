import { describe, expect, it } from "vitest";
import { sampleProjects } from "../../test/fixtures";
import { calculateSummary } from "./summary";

describe("calculateSummary", () => {
  it("summarises active delivery health and recurring value", () => {
    const summary = calculateSummary(
      sampleProjects,
      new Date("2026-07-27T09:00:00.000Z"),
    );

    expect(summary).toEqual({
      activeProjects: 2,
      atRiskProjects: 1,
      dueSoon: 2,
      monthlyValue: 51150,
    });
  });

  it("returns zero values for an empty portfolio", () => {
    expect(calculateSummary([])).toEqual({
      activeProjects: 0,
      atRiskProjects: 0,
      dueSoon: 0,
      monthlyValue: 0,
    });
  });
});
