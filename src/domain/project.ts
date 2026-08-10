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

export const orderStageIds = [
  "customer-agreement",
  "crf-raised",
  "partner-order",
  "supplier-order",
  "survey-design",
  "delivery",
  "activation",
  "handover",
] as const;

export const blockerTypes = [
  "ECC",
  "Wayleave",
  "Site access",
  "Survey failure",
  "Network capacity",
  "Stock or lead time",
  "Order data mismatch",
  "Number porting",
] as const;

export const projectSortFields = [
  "updatedAt",
  "customer",
  "dueDate",
  "monthlyValue",
  "status",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectPriority = (typeof projectPriorities)[number];
export type StatusFilter = "All statuses" | ProjectStatus;
export type OrderStageId = (typeof orderStageIds)[number];
export type BlockerType = (typeof blockerTypes)[number];
export type ProjectSortField = (typeof projectSortFields)[number];
export type SortDirection = "asc" | "desc";
export type OrderParty =
  | "MSP"
  | "Customer"
  | "Third-party partner"
  | "Supplier";

export interface OrderBlocker {
  id: string;
  type: BlockerType;
  summary: string;
  status: "Open" | "Resolved";
  accountableParty: OrderParty;
  resolverRole: string;
  nextAction: string;
  targetDate: string;
}

export interface Project {
  id: string;
  customer: string;
  name: string;
  product: string;
  site: string;
  owner: string;
  salesOwner: string;
  thirdParty: string;
  supplier: string;
  crfReference: string;
  thirdPartyReference: string;
  supplierReference: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  currentStage: OrderStageId;
  dueDate: string;
  openRisks: number;
  blockers: OrderBlocker[];
  monthlyValue: number;
  updatedAt: string;
}

export type ProjectDraft = Omit<Project, "id" | "updatedAt">;

export interface ProjectFilters {
  search: string;
  status: StatusFilter;
}

export interface ProjectListState extends ProjectFilters {
  sort: ProjectSortField;
  direction: SortDirection;
  page: number;
}

export interface PaginatedProjects {
  items: Project[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const statusOrder: Record<ProjectStatus, number> = {
  Blocked: 0,
  "At risk": 1,
  "On track": 2,
  Complete: 3,
};

export function filterProjects(
  projects: Project[],
  filters: ProjectFilters,
): Project[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return projects.filter((project) => {
    const matchesStatus =
      filters.status === "All statuses" || project.status === filters.status;
    const matchesSearch =
      !search ||
      [
        project.customer,
        project.name,
        project.product,
        project.site,
        project.owner,
        project.salesOwner,
        project.thirdParty,
        project.supplier,
        project.crfReference,
        project.thirdPartyReference,
        project.supplierReference,
      ].some((value) => value.toLocaleLowerCase().includes(search));

    return matchesStatus && matchesSearch;
  });
}

export function sortProjects(
  projects: Project[],
  sort: ProjectSortField,
  direction: SortDirection,
): Project[] {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...projects].sort((left, right) => {
    if (sort === "monthlyValue") {
      return (left.monthlyValue - right.monthlyValue) * multiplier;
    }

    if (sort === "status") {
      return (statusOrder[left.status] - statusOrder[right.status]) * multiplier;
    }

    return left[sort].localeCompare(right[sort], undefined, {
      numeric: true,
      sensitivity: "base",
    }) * multiplier;
  });
}

export function paginateProjects(
  projects: Project[],
  requestedPage: number,
  pageSize: number,
): PaginatedProjects {
  const totalPages = Math.max(1, Math.ceil(projects.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: projects.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: projects.length,
    totalPages,
  };
}
