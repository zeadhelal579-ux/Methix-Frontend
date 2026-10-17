// ============================================================
// File: src/components/common/ErrorBoundary.tsx
// Purpose: Global React Error Boundary — the last line of defense
//          against an unhandled render-time exception blanking the
//          entire app to a silent white screen.
// Logic:
//   - Closes a gap explicitly documented as open in
//     01-frontend-architecture.md §5 ("No global React Error
//     Boundary exists anywhere in the codebase") and repeated in
//     MASTER-ARCHITECTURE-SUMMARY.md §4.5: this is a concrete,
//     reachable risk, not a hypothetical one — e.g. the emission
//     level shown by StatusBadge ultimately comes from the external
//     AI microservice's free-text response with no server-side
//     whitelist, so a single unexpected value there previously had
//     no safety net at all.
//   - React Error Boundaries must be class components — there is no
//     hook equivalent of componentDidCatch/getDerivedStateFromError
//     as of the React version used here — so this is intentionally
//     the one class component in an otherwise fully-functional
//     component codebase.
//   - Wraps <App /> once in main.tsx, above the router, so it can
//     catch a render error on ANY page, not just one route.
//   - "Reload" is a full window.location.reload(), matching the
//     app's existing pattern of a hard reload to fully reset state
//     after something has gone seriously wrong (axiosClient's 401
//     handler does the same for the same reason).
// ============================================================
import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    // Flips render state as soon as a descendant throws during render
    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    // Logs the error for local debugging; no telemetry/error-tracking
    // service is wired up anywhere in this project (see
    // 05-devops-infra-tools.md), so a console log is the only
    // record of this today
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Unhandled render error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container/20">
                        <TriangleAlert className="h-6 w-6 text-error" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="font-display text-lg font-semibold text-on-surface">
                            Something went wrong
                        </h1>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            An unexpected error occurred. Reloading usually fixes this.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container"
                    >
                        Reload page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
