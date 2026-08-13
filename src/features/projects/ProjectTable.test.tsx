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
        onOpenProject={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("table", {
        name: /managed service orders/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Northstar Health")).toBeInTheDocument();
    expect(screen.getByText("At risk")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Northstar Health order progress",
      }),
    ).toHaveValue(6);
  });

  it("offers to clear filters when no projects match", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(
      <ProjectTable
        projects={[]}
        hasFilters
        onClearFilters={onClearFilters}
        onOpenProject={vi.fn()}
      />,
    );

    expect(screen.getByText("No matching orders")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it("renders API-provided text without interpreting markup", () => {
    const unsafeCustomer = '<script data-testid="injected">alert(1)</script>';
    const { container } = render(
      <ProjectTable
        projects={[{ ...sampleProjects[0]!, customer: unsafeCustomer }]}
        hasFilters={false}
        onClearFilters={vi.fn()}
        onOpenProject={vi.fn()}
      />,
    );

    expect(screen.getByText(unsafeCustomer)).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });
});
