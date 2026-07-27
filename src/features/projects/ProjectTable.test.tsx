import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleProjects } from "../../test/fixtures";
import { ProjectTable } from "./ProjectTable";

describe("ProjectTable", () => {
  it("renders accessible project details and progress values", () => {
    render(
      <ProjectTable
        projects={sampleProjects}
        hasFilters={false}
        onClearFilters={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("table", {
        name: /customer implementation projects/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Northstar Health")).toBeInTheDocument();
    expect(screen.getByText("At risk")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Northstar Health progress" }),
    ).toHaveValue(72);
  });

  it("offers to clear filters when no projects match", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(
      <ProjectTable
        projects={[]}
        hasFilters
        onClearFilters={onClearFilters}
      />,
    );

    expect(screen.getByText("No matching projects")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
