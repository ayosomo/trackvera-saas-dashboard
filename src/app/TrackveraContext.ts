import { createContext, useContext } from "react";
import type { OrderBlocker, Project } from "../domain/project";

export interface TrackveraFeedback {
  kind: "success" | "error";
  message: string;
}

export interface TrackveraContextValue {
  projects: Project[];
  isLoading: boolean;
  isLoadError: boolean;
  loadError: unknown;
  refetchProjects: () => void;
  feedback: TrackveraFeedback | null;
  dismissFeedback: () => void;
  openNewProject: (returnFocusTo?: HTMLElement | null) => void;
  openProjectEditor: (project: Project) => void;
  openNotifications: (returnFocusTo?: HTMLElement | null) => void;
  unreadNotificationCount: number;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canUpdateDelivery: boolean;
  isUpdating: boolean;
  advanceMilestone: (project: Project) => void;
  addBlocker: (project: Project, blocker: OrderBlocker) => void;
  resolveBlocker: (project: Project, blockerId: string) => void;
}

export const TrackveraContext = createContext<TrackveraContextValue | null>(null);

export function useTrackvera(): TrackveraContextValue {
  const value = useContext(TrackveraContext);
  if (!value) throw new Error("useTrackvera must be used inside TrackveraShell.");
  return value;
}
