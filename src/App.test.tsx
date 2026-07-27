import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProject, getProjects } from "./api/projects";
import { App } from "./App";
import { sampleProjects } from "./test/fixtures";
import type { Project } from "./types";

vi.mock("./api/projects", () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
}));

const getProjectsMock = vi.mocked(getProjects);
const createProjectMock = vi.mocked(createProject);

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

async function openProjectModal() {
  renderApp();
  const user = userEvent.setup();
  await screen.findByRole("heading", { name: "Delivery overview" });
  await user.click(screen.getByRole("button", { name: /new project/i }));
  await screen.findByRole("dialog", { name: "Create a project" });
  return user;
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^customer/i), "Atlas Labs");
  await user.type(screen.getByLabelText(/^project name/i), "Platform launch");
  await user.type(screen.getByLabelText(/^owner/i), "Jamie Singh");
  await user.type(screen.getByLabelText(/^due date/i), "2026-10-15");
  await user.type(screen.getByLabelText(/^monthly value/i), "14500");
}

beforeEach(() => {
  getProjectsMock.mockResolvedValue(sampleProjects);
  createProjectMock.mockReset();
});

describe("project creation workflow", () => {
  it("opens and closes the modal, restoring focus to the trigger", async () => {
    const user = await openProjectModal();
    const trigger = screen.getByRole("button", { name: /^new project$/i });

    expect(screen.getByLabelText(/^customer/i)).toHaveFocus();
    await user.click(
      screen.getByRole("button", { name: "Close new project dialog" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("shows accessible errors and focuses the first invalid field", async () => {
    const user = await openProjectModal();
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(
      screen.getByText("Check the highlighted fields."),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a customer name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a project name.")).toBeInTheDocument();
    expect(screen.getByText("Choose a due date.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/^customer/i)).toHaveFocus(),
    );
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("submits a valid project and confirms success", async () => {
    const createdProject: Project = {
      id: "project-new",
      customer: "Atlas Labs",
      name: "Platform launch",
      owner: "Jamie Singh",
      status: "On track",
      priority: "Medium",
      progress: 0,
      dueDate: "2026-10-15",
      openRisks: 0,
      monthlyValue: 14500,
      updatedAt: "2026-07-27T12:00:00.000Z",
    };
    createProjectMock.mockResolvedValue(createdProject);
    const user = await openProjectModal();
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(createProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "Atlas Labs",
        name: "Platform launch",
        monthlyValue: 14500,
      }),
      expect.anything(),
    );
    expect(
      await screen.findByText("Atlas Labs was added successfully."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Atlas Labs")).toBeInTheDocument();
  });

  it("rolls back the optimistic row and keeps the form open on failure", async () => {
    createProjectMock.mockRejectedValue(new Error("Service unavailable"));
    const user = await openProjectModal();
    await fillRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByText("Project not created.")).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Atlas Labs")).not.toBeInTheDocument();
    expect(screen.getByText("Northstar Health")).toBeInTheDocument();
  });

  it("closes with Escape and returns focus", async () => {
    const user = await openProjectModal();
    const trigger = screen.getByRole("button", { name: /^new project$/i });

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
