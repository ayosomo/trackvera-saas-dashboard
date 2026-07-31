import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleOrders } from "../../test/fixtures";
import { OrderTable } from "./OrderTable";

describe("OrderTable", () => {
  it("renders accessible order details and progress values", () => {
    render(
      <OrderTable
        orders={sampleOrders}
        hasFilters={false}
        onClearFilters={vi.fn()}
        onOpenOrder={vi.fn()}
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

  it("offers to clear filters when no orders match", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(
      <OrderTable
        orders={[]}
        hasFilters
        onClearFilters={onClearFilters}
        onOpenOrder={vi.fn()}
      />,
    );

    expect(screen.getByText("No matching orders")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
