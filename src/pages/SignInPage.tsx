import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";
import { mockIdentities, roleLabels } from "../security/permissions";

interface AuthenticationLocationState {
  returnTo?: string;
}

export function SignInPage() {
  const { status, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo =
    (location.state as AuthenticationLocationState | null)?.returnTo ??
    "/projects";

  if (status === "authenticated") {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <div className="auth-card__brand" aria-hidden="true">
          F
        </div>
        <p className="eyebrow">401 · Unauthorised</p>
        <h1 id="sign-in-title">Sign in required</h1>
        <p>
          Choose a mock identity to demonstrate the frontend authentication and
          permission contract. No passwords or real credentials are stored.
        </p>
        <div className="identity-grid" aria-label="Mock identities">
          {mockIdentities.map((identity) => (
            <button
              type="button"
              className="identity-card"
              key={identity.id}
              onClick={() => {
                signIn(identity.id);
                navigate(returnTo, { replace: true });
              }}
            >
              <span className="identity-card__avatar" aria-hidden="true">
                {identity.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <span>
                <strong>{identity.name}</strong>
                <small>{roleLabels[identity.role]}</small>
                <small>{identity.title}</small>
              </span>
            </button>
          ))}
        </div>
        <p className="auth-card__boundary">
          Interface permissions improve usability. A production API must still
          enforce every authorisation decision server-side.
        </p>
      </section>
    </main>
  );
}
