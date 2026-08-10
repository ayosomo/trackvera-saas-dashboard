import type { Project } from "../../domain/project";

export interface DashboardSummary {
  activeProjects: number;
  atRiskProjects: number;
  dueSoon: number;
  monthlyValue: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function calculateSummary(
  projects: Project[],
  now = new Date(),
): DashboardSummary {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dueSoonLimit = today.getTime() + 30 * DAY_IN_MS;
  const activeProjects = projects.filter(
    (project) => project.status !== "Complete",
  );

  return {
    activeProjects: activeProjects.length,
    atRiskProjects: activeProjects.filter(
      (project) => project.status === "At risk" || project.status === "Blocked",
    ).length,
    dueSoon: activeProjects.filter((project) => {
      const dueTime = new Date(`${project.dueDate}T00:00:00`).getTime();
      return dueTime >= today.getTime() && dueTime <= dueSoonLimit;
    }).length,
    monthlyValue: activeProjects.reduce(
      (total, project) => total + project.monthlyValue,
      0,
    ),
  };
}
