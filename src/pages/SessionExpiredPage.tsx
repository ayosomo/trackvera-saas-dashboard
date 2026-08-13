import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

interface SessionLocationState {
  returnTo?: string;
}

export function SessionExpiredPage() {
  const { status, user, signIn, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo =
    (location.state as SessionLocationState | null)?.returnTo ?? "/projects";

  if (status === "authenticated") {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card--compact" role="alert">
        <p className="eyebrow">Session protection</p>
        <h1>Your session has expired</h1>
        <p>
          Project data was cleared from the client cache. Resume the mock
          session or return to identity selection.
        </p>
        <div className="auth-card__actions">
          {user && (
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                signIn(user.id);
                navigate(returnTo, { replace: true });
              }}
            >
              Resume as {user.name}
            </button>
          )}
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              signOut();
              navigate("/sign-in", { replace: true, state: { returnTo } });
            }}
          >
            Choose another identity
          </button>
        </div>
      </section>
    </main>
  );
}
