import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function UnexpectedErrorPage() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "An unexpected application error occurred.";

  return (
    <main className="unexpected-error-page">
      <div className="route-state" role="alert">
        <span className="route-state__code">Unexpected error</span>
        <h1>FlowOps hit a problem</h1>
        <p>{detail}</p>
        <p>Your order data has not been changed.</p>
        <Link className="button button--primary" to="/projects">
          Return to control tower
        </Link>
      </div>
    </main>
  );
}
