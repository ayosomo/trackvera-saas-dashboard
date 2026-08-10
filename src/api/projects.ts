import { environment } from "../config/environment";
import type { Project, ProjectDraft } from "../domain/project";

const STORAGE_KEY = "flowops-created-projects";

interface GetProjectsOptions {
  signal?: AbortSignal;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`The service returned ${response.status}. Please try again.`);
  }

  return (await response.json()) as T;
}

function readDemoProjects(): Project[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as Project[]) : [];
  } catch {
    return [];
  }
}

function saveDemoProject(project: Project): void {
  const projects = readDemoProjects();
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([project, ...projects.filter((item) => item.id !== project.id)]),
  );
}

function createId(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getProjects(
  options: GetProjectsOptions = {},
): Promise<Project[]> {
  const apiBaseUrl = environment.apiBaseUrl;
  const endpoint = apiBaseUrl ? `${apiBaseUrl}/projects` : "/projects.json";
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    signal: options.signal,
  });
  const projects = await readJson<Project[]>(response);

  if (apiBaseUrl) return projects;

  const savedProjects = readDemoProjects();
  const savedIds = new Set(savedProjects.map((project) => project.id));
  return [
    ...savedProjects,
    ...projects.filter((project) => !savedIds.has(project.id)),
  ];
}

export async function createProject(draft: ProjectDraft): Promise<Project> {
  const apiBaseUrl = environment.apiBaseUrl;

  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/projects`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });

    return readJson<Project>(response);
  }

  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const project: Project = {
    ...draft,
    id: createId(),
    updatedAt: new Date().toISOString(),
  };
  saveDemoProject(project);

  return project;
}

export async function updateProject(project: Project): Promise<Project> {
  const apiBaseUrl = environment.apiBaseUrl;

  if (apiBaseUrl) {
    const response = await fetch(`${apiBaseUrl}/projects/${project.id}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    });

    return readJson<Project>(response);
  }

  await new Promise((resolve) => window.setTimeout(resolve, 350));
  const updatedProject = { ...project, updatedAt: new Date().toISOString() };
  saveDemoProject(updatedProject);
  return updatedProject;
}
