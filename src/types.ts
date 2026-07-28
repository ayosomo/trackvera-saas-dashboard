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

export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectPriority = (typeof projectPriorities)[number];
export type StatusFilter = "All statuses" | ProjectStatus;
export type OrderStageId = (typeof orderStageIds)[number];
export type BlockerType = (typeof blockerTypes)[number];
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
