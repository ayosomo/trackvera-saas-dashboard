import { useRoutes } from "react-router-dom";
import { routes } from "./router";

export function AppRoutes() {
  return useRoutes(routes);
}
