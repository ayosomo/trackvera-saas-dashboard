export const projectStatuses = [
  "On track",
  "At risk",
  "Blocked",
  "Complete",
] as const;

export const projectPriorities = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectPriority = (typeof projectPriorities)[number];
export type StatusFilter = "All statuses" | ProjectStatus;

export interface Project {
  id: string;
  customer: string;
  name: string;
  owner: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  dueDate: string;
  openRisks: number;
  monthlyValue: number;
  updatedAt: string;
}

export type ProjectDraft = Omit<Project, "id" | "updatedAt">;

export interface ProjectFilters {
  search: string;
  status: StatusFilter;
}
