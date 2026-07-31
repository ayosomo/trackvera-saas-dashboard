import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderFilters } from "./OrderFilters";

describe("OrderFilters", () => {
  it("reports search and status changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <OrderFilters
        filters={{ search: "", status: "All statuses" }}
        resultCount={7}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "Northstar");
    expect(onChange).toHaveBeenLastCalledWith({
      search: "r",
      status: "All statuses",
    });

    rerender(
      <OrderFilters
        filters={{ search: "Northstar", status: "All statuses" }}
        resultCount={1}
        onChange={onChange}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Filter by status"), "At risk");

    expect(onChange).toHaveBeenLastCalledWith({
      search: "Northstar",
      status: "At risk",
    });
    expect(screen.getByText("1 order")).toBeInTheDocument();
  });
});
