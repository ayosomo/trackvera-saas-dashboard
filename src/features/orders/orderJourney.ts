import type {
  BlockerType,
  OrderParty,
  OrderStageId,
  Project,
} from "../../domain/project";

export interface JourneyStage {
  id: OrderStageId;
  label: string;
  shortLabel: string;
  description: string;
  responsible: string;
  accountable: OrderParty;
  consulted: string;
  informed: string;
  nextAction: string;
}

export interface BlockerPlaybook {
  accountableParty: OrderParty;
  resolverRole: string;
  nextAction: string;
}

export const orderJourney: JourneyStage[] = [
  {
    id: "customer-agreement",
    label: "Customer agreement",
    shortLabel: "Agreement",
    description: "Commercial scope, product, site, price, and target date agreed.",
    responsible: "Sales",
    accountable: "MSP",
    consulted: "Solutions / Delivery",
    informed: "Customer and Order owner",
    nextAction: "Confirm the signed quote and hand the agreed scope to Sales Ops.",
  },
  {
    id: "crf-raised",
    label: "CRF raised",
    shortLabel: "CRF",
    description: "The complete customer request form is quality checked.",
    responsible: "Sales Ops",
    accountable: "MSP",
    consulted: "Order owner and Customer",
    informed: "Third-party partner",
    nextAction: "Validate mandatory CRF data, site contacts, and quote alignment.",
  },
  {
    id: "partner-order",
    label: "Partner order accepted",
    shortLabel: "Partner ref",
    description: "The third-party partner has accepted the request and issued its reference.",
    responsible: "Order owner",
    accountable: "Third-party partner",
    consulted: "Sales Ops",
    informed: "Customer and Supplier",
    nextAction: "Capture the partner reference and confirm the supplier quote is still valid.",
  },
  {
    id: "supplier-order",
    label: "Supplier order placed",
    shortLabel: "Supplier ref",
    description: "The supplier portal order is submitted and acknowledged.",
    responsible: "Order owner",
    accountable: "MSP",
    consulted: "Third-party partner",
    informed: "Customer and Sales",
    nextAction: "Record the supplier reference and validate the committed lead time.",
  },
  {
    id: "survey-design",
    label: "Survey and design",
    shortLabel: "Survey",
    description: "Site survey, network design, ECC, and consent checks are completed.",
    responsible: "Supplier delivery team",
    accountable: "Supplier",
    consulted: "Customer, Order owner, Property contact",
    informed: "Third-party partner and Sales",
    nextAction: "Review the survey outcome and resolve ECC, access, or wayleave exceptions.",
  },
  {
    id: "delivery",
    label: "Delivery in progress",
    shortLabel: "Delivery",
    description: "Network, hardware, or service build is actively being delivered.",
    responsible: "Supplier delivery team",
    accountable: "Supplier",
    consulted: "Order owner and Customer",
    informed: "Third-party partner and Sales",
    nextAction: "Track the committed date, dependencies, and daily exception updates.",
  },
  {
    id: "activation",
    label: "Activation and test",
    shortLabel: "Activation",
    description: "The service is activated, tested, and accepted against the order.",
    responsible: "Technical delivery",
    accountable: "MSP",
    consulted: "Supplier and Customer IT",
    informed: "Sales and Third-party partner",
    nextAction: "Complete technical testing and obtain the customer acceptance result.",
  },
  {
    id: "handover",
    label: "Handover complete",
    shortLabel: "Handover",
    description: "Billing, support, documentation, and customer handover are complete.",
    responsible: "Order owner",
    accountable: "MSP",
    consulted: "Support, Billing, Sales",
    informed: "Customer and all supply-chain partners",
    nextAction: "Confirm billing start, support ownership, and close the project tracker.",
  },
];

export const blockerPlaybooks: Record<BlockerType, BlockerPlaybook> = {
  ECC: {
    accountableParty: "Customer",
    resolverRole: "MSP Commercial owner",
    nextAction:
      "Validate the supplier charges, explain options, and obtain customer approval or redesign instruction.",
  },
  Wayleave: {
    accountableParty: "Customer",
    resolverRole: "Property owner / Customer legal",
    nextAction:
      "Issue the wayleave pack, identify the legal signatory, and agree a chase date with the supplier.",
  },
  "Site access": {
    accountableParty: "Customer",
    resolverRole: "Customer site contact",
    nextAction:
      "Confirm access hours, named engineer entry, permits, parking, and escort requirements.",
  },
  "Survey failure": {
    accountableParty: "Supplier",
    resolverRole: "Supplier design team",
    nextAction:
      "Request the failed-survey evidence, revised design, cost impact, and new committed date.",
  },
  "Network capacity": {
    accountableParty: "Supplier",
    resolverRole: "Supplier planning team",
    nextAction:
      "Obtain the capacity remediation plan, dependency owner, and earliest achievable date.",
  },
  "Stock or lead time": {
    accountableParty: "Supplier",
    resolverRole: "Supplier fulfilment",
    nextAction:
      "Confirm substitute stock, split delivery options, and the next inventory checkpoint.",
  },
  "Order data mismatch": {
    accountableParty: "MSP",
    resolverRole: "Sales Ops",
    nextAction:
      "Compare the CRF, signed quote, and portal order; correct the source record and resubmit.",
  },
  "Number porting": {
    accountableParty: "Customer",
    resolverRole: "Customer telecoms contact",
    nextAction:
      "Validate losing-provider details, numbers, postcode, authorisation, and resubmission date.",
  },
};

export function getStage(stageId: OrderStageId): JourneyStage {
  return orderJourney.find((stage) => stage.id === stageId) ?? orderJourney[0]!;
}

export function getStageIndex(stageId: OrderStageId): number {
  return Math.max(
    0,
    orderJourney.findIndex((stage) => stage.id === stageId),
  );
}

export function getStageProgress(stageId: OrderStageId): number {
  return Math.round(((getStageIndex(stageId) + 1) / orderJourney.length) * 100);
}

export function getNextStage(stageId: OrderStageId): JourneyStage | null {
  return orderJourney[getStageIndex(stageId) + 1] ?? null;
}

export function advanceOrder(project: Project): Project {
  const nextStage = getNextStage(project.currentStage);
  if (!nextStage) return project;

  return {
    ...project,
    currentStage: nextStage.id,
    progress: getStageProgress(nextStage.id),
    status: nextStage.id === "handover" ? "Complete" : "On track",
    updatedAt: new Date().toISOString(),
  };
}
