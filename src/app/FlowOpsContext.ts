import { createContext, useContext } from "react";
import type { OrderBlocker, Project } from "../domain/project";

export interface FlowOpsFeedback {
  kind: "success" | "error";
  message: string;
}

export interface FlowOpsContextValue {
  projects: Project[];
  isLoading: boolean;
  isLoadError: boolean;
  loadError: unknown;
  refetchProjects: () => void;
  feedback: FlowOpsFeedback | null;
  dismissFeedback: () => void;
  openNewProject: (returnFocusTo?: HTMLElement | null) => void;
  openProjectEditor: (project: Project) => void;
  openNotifications: (returnFocusTo?: HTMLElement | null) => void;
  unreadNotificationCount: number;
  isUpdating: boolean;
  advanceMilestone: (project: Project) => void;
  addBlocker: (project: Project, blocker: OrderBlocker) => void;
  resolveBlocker: (project: Project, blockerId: string) => void;
}

export const FlowOpsContext = createContext<FlowOpsContextValue | null>(null);

export function useFlowOps(): FlowOpsContextValue {
  const value = useContext(FlowOpsContext);
  if (!value) throw new Error("useFlowOps must be used inside FlowOpsShell.");
  return value;
}
