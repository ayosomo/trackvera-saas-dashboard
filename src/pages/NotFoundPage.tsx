import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="route-state">
      <span className="route-state__code">404</span>
      <h1>That Trackvera page isn’t here</h1>
      <p>
        Check the address or return to the order portfolio to continue managing
        delivery.
      </p>
      <Link className="button button--primary" to="/projects">
        Return to control tower
      </Link>
    </div>
  );
}
