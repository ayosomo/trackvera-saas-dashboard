import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { FlowOpsShell } from "./FlowOpsShell";
import { ForbiddenPage } from "../pages/ForbiddenPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { RootRedirect } from "../pages/RootRedirect";
import { SessionExpiredPage } from "../pages/SessionExpiredPage";
import { SignInPage } from "../pages/SignInPage";
import { UnexpectedErrorPage } from "../pages/UnexpectedErrorPage";
import { RequireAuthentication } from "../security/RequireAuthentication";

export const routes: RouteObject[] = [
  {
    path: "/sign-in",
    Component: SignInPage,
  },
  {
    path: "/session-expired",
    Component: SessionExpiredPage,
  },
  {
    Component: RequireAuthentication,
    children: [
      {
        path: "/",
        Component: FlowOpsShell,
        ErrorBoundary: UnexpectedErrorPage,
        children: [
          { index: true, Component: RootRedirect },
          { path: "projects", Component: ProjectsPage },
          { path: "projects/:projectId", Component: ProjectDetailPage },
          { path: "forbidden", Component: ForbiddenPage },
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
];

export const appRouter = createBrowserRouter(routes);
