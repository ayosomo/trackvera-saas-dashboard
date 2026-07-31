import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("FlowOps render failure", error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <p className="eyebrow">FlowOps</p>
          <h1>The dashboard could not be displayed</h1>
          <p>Reload the page. If the problem continues, contact the workspace owner.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            Reload dashboard
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
