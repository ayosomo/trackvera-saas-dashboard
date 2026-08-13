import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuthentication() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "expired") {
    return (
      <Navigate
        to="/session-expired"
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (status !== "authenticated") {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
