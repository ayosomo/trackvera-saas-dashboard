import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOrder,
  getOrders,
  updateOrder,
} from "./api/orders";
import { App } from "./App";
import { sampleOrders } from "./test/fixtures";
import type { Order } from "./types";

vi.mock("./api/orders", () => ({
  getOrders: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
}));

const getOrdersMock = vi.mocked(getOrders);
const createOrderMock = vi.mocked(createOrder);
const updateOrderMock = vi.mocked(updateOrder);

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

async function openOrderModal() {
  renderApp();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Order control tower" });
  await user.click(screen.getByRole("button", { name: "New order" }));
  await screen.findByRole("dialog", { name: "Create an order tracker" });
  return user;
}

async function fillOrderWizard(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^customer/i), "Atlas Labs");
  await user.type(
    screen.getByLabelText(/^order name/i),
    "Platform launch",
  );
  await user.type(screen.getByLabelText(/^product or service/i), "Managed DIA");
  await user.type(
    screen.getByLabelText(/^delivery site or scope/i),
    "London, EC2A 1AA",
  );
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await user.type(
    screen.getByLabelText(/^third-party ordering partner/i),
    "ChannelLink",
  );
  await user.type(
    screen.getByLabelText(/^fulfilment supplier/i),
    "Openreach",
  );
  await user.type(screen.getByLabelText(/^crf reference/i), "CRF-NEW-001");
  await user.type(
    screen.getByLabelText(/^third-party order reference/i),
    "CL-NEW-001",
  );
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await user.type(screen.getByLabelText(/^msp order owner/i), "Jamie Singh");
  await user.type(screen.getByLabelText(/^sales owner/i), "Alex Morgan");
  await user.type(screen.getByLabelText(/^target live date/i), "2026-10-15");
  await user.type(
    screen.getByLabelText(/^monthly contract value/i),
    "14500",
  );
}

beforeEach(() => {
  getOrdersMock.mockReset();
  getOrdersMock.mockResolvedValue(sampleOrders);
  createOrderMock.mockReset();
  updateOrderMock.mockReset();
  updateOrderMock.mockImplementation(async (order) => order);
});

describe("Phase 1 portfolio states", () => {
  it("renders a loading state while the portfolio request is pending", () => {
    getOrdersMock.mockReturnValue(new Promise(() => undefined));
    renderApp();

    expect(screen.getByLabelText("Loading dashboard")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders a successful portfolio and announces the result count", async () => {
    renderApp();

    expect(await screen.findByText("Northstar Health")).toBeInTheDocument();
    expect(screen.getByText("3 orders")).toHaveAttribute("aria-live", "polite");
  });

  it("offers a retry after a failed request", async () => {
    getOrdersMock
      .mockRejectedValueOnce(new Error("Service unavailable"))
      .mockResolvedValueOnce(sampleOrders);
    renderApp();
    const user = userEvent.setup();

    expect(
      await screen.findByRole("heading", { name: /load the order portfolio/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Northstar Health")).toBeInTheDocument();
  });

  it("shows the unfiltered empty state", async () => {
    getOrdersMock.mockResolvedValue([]);
    renderApp();

    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create an order to start its delivery tracker."),
    ).toBeInTheDocument();
  });

  it("filters by search and status together and clears the empty result", async () => {
    renderApp();
    const user = userEvent.setup();
    await screen.findByText("Northstar Health");

    await user.type(screen.getByRole("searchbox"), "veridian");
    expect(screen.getByText("1 order")).toBeInTheDocument();
    expect(screen.getByText("Veridian Bank")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "Blocked");
    expect(await screen.findByText("No matching orders")).toBeInTheDocument();
    expect(screen.getByText("0 orders")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("Northstar Health")).toBeInTheDocument();
    expect(screen.getByText("3 orders")).toBeInTheDocument();
  });

  it("presents malformed-data failures as a controlled error state", async () => {
    getOrdersMock.mockRejectedValue(
      new Error("The order service returned invalid data."),
    );
    renderApp();

    expect(
      await screen.findByText("The order service returned invalid data."),
    ).toBeInTheDocument();
  });
});

describe("MSP order orchestration", () => {
  it("opens and closes the order wizard, restoring focus to the trigger", async () => {
    const user = await openOrderModal();
    const trigger = screen.getByRole("button", { name: "New order" });

    expect(screen.getByLabelText(/^customer/i)).toHaveFocus();
    await user.click(
      screen.getByRole("button", { name: "Close new order dialog" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("validates each creation step and focuses the first invalid field", async () => {
    const user = await openOrderModal();
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText("Enter the customer name.")).toBeInTheDocument();
    expect(
      screen.getByText("Enter an order name."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter the agreed product or service."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/^customer/i)).toHaveFocus(),
    );
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("creates a tracker at the correct reference milestone and notifies its owner", async () => {
    const createdOrder: Order = {
      id: "order-new",
      customer: "Atlas Labs",
      name: "Platform launch",
      product: "Managed DIA",
      site: "London, EC2A 1AA",
      owner: "Jamie Singh",
      salesOwner: "Alex Morgan",
      thirdParty: "ChannelLink",
      supplier: "Openreach",
      crfReference: "CRF-NEW-001",
      thirdPartyReference: "CL-NEW-001",
      supplierReference: "",
      status: "On track",
      priority: "Medium",
      progress: 38,
      currentStage: "partner-order",
      dueDate: "2026-10-15",
      openRisks: 0,
      blockers: [],
      monthlyValue: 14500,
      updatedAt: "2026-07-27T12:00:00.000Z",
    };
    getOrdersMock
      .mockResolvedValueOnce(sampleOrders)
      .mockResolvedValue([createdOrder, ...sampleOrders]);
    createOrderMock.mockResolvedValue(createdOrder);
    const user = await openOrderModal();
    await fillOrderWizard(user);
    await user.click(
      screen.getByRole("button", { name: "Create order tracker" }),
    );

    expect(createOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "Atlas Labs",
        currentStage: "partner-order",
        thirdPartyReference: "CL-NEW-001",
        supplierReference: "",
      }),
      expect.anything(),
    );
    expect(
      await screen.findByText(
        "Atlas Labs tracker is ready and Jamie Singh was notified.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Atlas Labs")).toBeInTheDocument();
  });

  it("rolls back a failed tracker creation and keeps the populated wizard open", async () => {
    createOrderMock.mockRejectedValue(new Error("Service unavailable"));
    const user = await openOrderModal();
    await fillOrderWizard(user);
    await user.click(
      screen.getByRole("button", { name: "Create order tracker" }),
    );

    expect(
      await screen.findByText("Order tracker not created."),
    ).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Atlas Labs")).not.toBeInTheDocument();
  });

  it("shows RACI ownership and an exception resolution playbook", async () => {
    renderApp();
    const user = userEvent.setup();
    await screen.findByText("Veridian Bank");
    await user.click(
      screen.getByRole("button", {
        name: "Open Veridian Bank order tracker",
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "Veridian Bank" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Who owns what?")).toBeInTheDocument();
    expect(screen.getByText("Construction charges awaiting approval.")).toBeInTheDocument();
    expect(
      screen.getByText("Validate charges and obtain customer approval."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Customer").length).toBeGreaterThan(0);
  });

  it("advances a clear milestone and creates an owner notification", async () => {
    renderApp();
    const user = userEvent.setup();
    await screen.findByText("Northstar Health");
    await user.click(
      screen.getByRole("button", {
        name: "Open Northstar Health order tracker",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Complete milestone → Activation",
      }),
    );

    await waitFor(() =>
      expect(updateOrderMock).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: "Northstar Health",
          currentStage: "activation",
        }),
      ),
    );
    expect(
      await screen.findByText("Maya Chen was notified of the order update."),
    ).toBeInTheDocument();
  });
});
