import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProject,
  getProjects,
  updateProject,
} from "./api/projects";
import { AppRoutes } from "./app/AppRoutes";
import { sampleProjects } from "./test/fixtures";
import type { Project } from "./domain/project";

vi.mock("./api/projects", () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
}));

const getProjectsMock = vi.mocked(getProjects);
const createProjectMock = vi.mocked(createProject);
const updateProjectMock = vi.mocked(updateProject);

function renderApp(initialEntry = "/projects") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  let currentLocation = initialEntry;

  function LocationObserver() {
    const location = useLocation();
    currentLocation = `${location.pathname}${location.search}`;
    return null;
  }

  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
        <LocationObserver />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, getLocation: () => currentLocation };
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
    screen.getByLabelText(/^order \/ project name/i),
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

async function openProjectEditor(customer = "Veridian Bank") {
  renderApp();
  const user = userEvent.setup();
  await screen.findByText(customer);
  await user.click(
    screen.getByRole("button", {
      name: `Open ${customer} order tracker`,
    }),
  );
  await user.click(screen.getByRole("button", { name: "Edit details" }));
  await screen.findByRole("dialog", { name: `Edit ${customer}` });
  return user;
}

beforeEach(() => {
  getProjectsMock.mockResolvedValue(sampleProjects);
  createProjectMock.mockReset();
  updateProjectMock.mockImplementation(async (project) => project);
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
      screen.getByText("Enter an order or project name."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter the agreed product or service."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/^customer/i)).toHaveFocus(),
    );
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("creates a tracker at the correct reference milestone and notifies its owner", async () => {
    const createdProject: Project = {
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
    createProjectMock.mockResolvedValue(createdProject);
    const user = await openOrderModal();
    await fillOrderWizard(user);
    await user.click(
      screen.getByRole("button", { name: "Create order tracker" }),
    );

    expect(createProjectMock).toHaveBeenCalledWith(
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
    createProjectMock.mockRejectedValue(new Error("Service unavailable"));
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

  it("edits a project without resetting its delivery journey", async () => {
    const user = await openProjectEditor();
    const customerField = screen.getByLabelText(/^customer/i);

    expect(customerField).toHaveValue("Veridian Bank");
    await user.clear(customerField);
    await user.type(customerField, "Veridian Group");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(
      screen.getByRole("button", { name: "Save project changes" }),
    );

    await waitFor(() =>
      expect(updateProjectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "project-2",
          customer: "Veridian Group",
          currentStage: "survey-design",
          openRisks: 1,
        }),
      ),
    );
    expect(
      await screen.findByText("Veridian Group was updated successfully."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Veridian Group" }),
    ).toBeInTheDocument();
  });

  it("rolls back a failed project edit and retains the entered form values", async () => {
    updateProjectMock.mockRejectedValueOnce(new Error("Update unavailable"));
    const user = await openProjectEditor();
    const customerField = screen.getByLabelText(/^customer/i);

    await user.clear(customerField);
    await user.type(customerField, "Veridian Group");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(
      screen.getByRole("button", { name: "Save project changes" }),
    );

    expect(
      await screen.findByText("Project changes not saved."),
    ).toBeInTheDocument();
    expect(screen.getByText("Update unavailable")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "← Back" }));
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByLabelText(/^customer/i)).toHaveValue("Veridian Group");

    await user.click(
      screen.getByRole("button", { name: "Close project editor" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Veridian Bank" }),
    ).toBeInTheDocument();
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
      screen.getByRole("heading", { name: "Veridian Bank" }),
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
      expect(updateProjectMock).toHaveBeenCalledWith(
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

  it("loads filters from the URL and writes changes back to it", async () => {
    const { getLocation } = renderApp(
      "/projects?q=Veridian&status=At+risk&sort=dueDate&direction=asc",
    );
    const user = userEvent.setup();

    expect(await screen.findByRole("searchbox")).toHaveValue("Veridian");
    expect(screen.getByLabelText("Filter by status")).toHaveValue("At risk");
    expect(screen.getByLabelText("Sort orders by")).toHaveValue("dueDate");

    await user.clear(screen.getByRole("searchbox"));
    await user.selectOptions(screen.getByLabelText("Filter by status"), "Blocked");

    await waitFor(() =>
      expect(getLocation()).toContain("status=Blocked"),
    );
    expect(getLocation()).not.toContain("q=");
  });

  it("supports direct project URLs and a dedicated not-found route", async () => {
    const { unmount } = renderApp("/projects/project-2");

    expect(
      await screen.findByRole("heading", { name: "Veridian Bank" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Who owns what?")).toBeInTheDocument();

    unmount();
    renderApp("/missing-page");
    expect(
      await screen.findByRole("heading", {
        name: "That FlowOps page isn’t here",
      }),
    ).toBeInTheDocument();
  });
});
