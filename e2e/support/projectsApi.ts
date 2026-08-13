import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page, Route } from "@playwright/test";
import type { Project, ProjectDraft } from "../../src/domain/project";

interface ProjectsApiOptions {
  getFailures?: number;
  getStatus?: 401 | 403;
  createFailures?: number;
  updateFailures?: number;
  updateStatus?: 401 | 403;
  mutationDelayMs?: number;
}

export interface ProjectsApiHarness {
  projects(): Project[];
}

function loadProjects(): Project[] {
  const fixturePath = resolve(process.cwd(), "public", "projects.json");
  return JSON.parse(readFileSync(fixturePath, "utf8")) as Project[];
}

function cloneProjects(projects: Project[]): Project[] {
  return structuredClone(projects);
}

async function delay(milliseconds: number) {
  await new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function respondWithError(route: Route, message: string) {
  await route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ message }),
  });
}

export async function installProjectsApi(
  page: Page,
  options: ProjectsApiOptions = {},
): Promise<ProjectsApiHarness> {
  let projects = cloneProjects(loadProjects());
  let remainingGetFailures = options.getFailures ?? 0;
  let remainingCreateFailures = options.createFailures ?? 0;
  let remainingUpdateFailures = options.updateFailures ?? 0;
  const mutationDelayMs = options.mutationDelayMs ?? 250;

  await page.route(/\/api\/projects(?:\/[^/?]+)?(?:\?.*)?$/, async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const pathParts = url.pathname.split("/").filter(Boolean);
    const projectId = pathParts.at(-1) === "projects" ? null : pathParts.at(-1);

    if (method === "GET" && !projectId) {
      if (options.getStatus) {
        await route.fulfill({
          status: options.getStatus,
          contentType: "application/json",
          body: JSON.stringify({ message: "Access rejected" }),
        });
        return;
      }

      if (remainingGetFailures > 0) {
        remainingGetFailures -= 1;
        await respondWithError(route, "The portfolio service is unavailable.");
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(projects),
      });
      return;
    }

    if (method === "POST" && !projectId) {
      await delay(mutationDelayMs);
      if (remainingCreateFailures > 0) {
        remainingCreateFailures -= 1;
        await respondWithError(route, "The order service rejected the request.");
        return;
      }

      const draft = request.postDataJSON() as ProjectDraft;
      const createdProject: Project = {
        ...draft,
        id: `ord-e2e-${projects.length + 1}`,
        updatedAt: "2026-08-10T12:00:00.000Z",
      };
      projects = [createdProject, ...projects];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(createdProject),
      });
      return;
    }

    if (method === "PATCH" && projectId) {
      await delay(mutationDelayMs);
      if (options.updateStatus) {
        await route.fulfill({
          status: options.updateStatus,
          contentType: "application/json",
          body: JSON.stringify({ message: "Access rejected" }),
        });
        return;
      }

      if (remainingUpdateFailures > 0) {
        remainingUpdateFailures -= 1;
        await respondWithError(route, "The order service rejected the update.");
        return;
      }

      const update = request.postDataJSON() as Project;
      const savedProject = {
        ...update,
        id: projectId,
        updatedAt: "2026-08-10T12:30:00.000Z",
      };
      projects = projects.map((project) =>
        project.id === projectId ? savedProject : project,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(savedProject),
      });
      return;
    }

    await route.fulfill({ status: 405, body: "Method not allowed" });
  });

  return {
    projects: () => cloneProjects(projects),
  };
}
