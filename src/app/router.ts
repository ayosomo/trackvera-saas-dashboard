import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { FlowOpsShell } from "./FlowOpsShell";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { RootRedirect } from "../pages/RootRedirect";
import { UnexpectedErrorPage } from "../pages/UnexpectedErrorPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: FlowOpsShell,
    ErrorBoundary: UnexpectedErrorPage,
    children: [
      { index: true, Component: RootRedirect },
      { path: "projects", Component: ProjectsPage },
      { path: "projects/:projectId", Component: ProjectDetailPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
];

export const appRouter = createBrowserRouter(routes);
