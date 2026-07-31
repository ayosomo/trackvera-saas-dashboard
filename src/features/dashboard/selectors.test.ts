import { describe, expect, it } from "vitest";
import { sampleOrders } from "../../test/fixtures";
import {
  calculateAccountability,
  countOpenExceptions,
  filterOrders,
} from "./selectors";

describe("dashboard selectors", () => {
  it("filters by search and status independently and together", () => {
    expect(
      filterOrders(sampleOrders, {
        search: "veridian",
        status: "All statuses",
      }).map((order) => order.customer),
    ).toEqual(["Veridian Bank"]);

    expect(
      filterOrders(sampleOrders, { search: "", status: "Complete" }).map(
        (order) => order.customer,
      ),
    ).toEqual(["CivicWorks"]);

    expect(
      filterOrders(sampleOrders, { search: "health", status: "On track" }).map(
        (order) => order.customer,
      ),
    ).toEqual(["Northstar Health"]);

    expect(
      filterOrders(sampleOrders, { search: "health", status: "Blocked" }),
    ).toEqual([]);
  });

  it("derives exception and accountability counts from order state", () => {
    expect(countOpenExceptions(sampleOrders)).toBe(1);
    expect(calculateAccountability(sampleOrders)).toEqual({
      msp: 0,
      external: 2,
      customer: 0,
    });
  });
});
