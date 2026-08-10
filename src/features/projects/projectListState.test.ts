import { describe, expect, it } from "vitest";
import {
  defaultProjectListState,
  readProjectListState,
  writeProjectListState,
} from "./projectListState";

describe("project list URL state", () => {
  it("reads valid filters, sorting and pagination", () => {
    expect(
      readProjectListState(
        new URLSearchParams(
          "q=veridian&status=At+risk&sort=dueDate&direction=asc&page=2",
        ),
      ),
    ).toEqual({
      search: "veridian",
      status: "At risk",
      sort: "dueDate",
      direction: "asc",
      page: 2,
    });
  });

  it("falls back when URL values are unsupported", () => {
    expect(
      readProjectListState(
        new URLSearchParams("status=Delayed&sort=owner&page=-4"),
      ),
    ).toEqual(defaultProjectListState);
  });

  it("keeps default values out of shareable URLs", () => {
    expect(writeProjectListState(defaultProjectListState).toString()).toBe("");
  });
});
