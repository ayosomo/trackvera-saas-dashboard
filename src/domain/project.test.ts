import { describe, expect, it } from "vitest";
import { sampleProjects } from "../test/fixtures";
import { filterProjects, paginateProjects, sortProjects } from "./project";

describe("project list rules", () => {
  it("filters across customer and reference data", () => {
    expect(
      filterProjects(sampleProjects, {
        search: "crf-002",
        status: "All statuses",
      }).map((project) => project.customer),
    ).toEqual(["Veridian Bank"]);
  });

  it("sorts by due date without mutating the source list", () => {
    const originalOrder = sampleProjects.map((project) => project.id);
    const sorted = sortProjects(sampleProjects, "dueDate", "asc");

    expect(sorted[0]?.customer).toBe("CivicWorks");
    expect(sampleProjects.map((project) => project.id)).toEqual(originalOrder);
  });

  it("clamps pagination to the final available page", () => {
    const page = paginateProjects(sampleProjects, 99, 1);

    expect(page.page).toBe(sampleProjects.length);
    expect(page.items).toHaveLength(1);
  });
});
