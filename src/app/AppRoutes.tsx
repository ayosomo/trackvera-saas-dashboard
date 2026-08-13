import { useRoutes } from "react-router-dom";
import { AuthProvider } from "../security/AuthProvider";
import { routes } from "./router";

function RouteTree() {
  return useRoutes(routes);
}

export function AppRoutes() {
  return (
    <AuthProvider>
      <RouteTree />
    </AuthProvider>
  );
}
