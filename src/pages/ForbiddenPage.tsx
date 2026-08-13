import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../security/AuthContext";
import { roleLabels } from "../security/permissions";

interface ForbiddenLocationState {
  detail?: string;
}

export function ForbiddenPage() {
  const { user } = useAuth();
  const location = useLocation();
  const detail = (location.state as ForbiddenLocationState | null)?.detail;

  return (
    <div className="route-state route-state--permission" role="alert">
      <span className="route-state__code">403 · Forbidden</span>
      <h1>This action is outside your permissions</h1>
      <p>
        {detail ??
          "Your identity can view this portfolio but cannot complete that action."}
      </p>
      {user && (
        <p>
          Signed in as <strong>{user.name}</strong> · {roleLabels[user.role]}
        </p>
      )}
      <Link className="button button--primary" to="/projects">
        Return to control tower
      </Link>
    </div>
  );
}
