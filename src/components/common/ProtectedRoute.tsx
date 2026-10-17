// ============================================================
// File: src/components/common/ProtectedRoute.tsx
// Purpose: Route guard that blocks access to private pages when
//          no user is logged in
// Logic:
//   - Reads isAuthenticated from AuthContext (via useAuth)
//   - If not authenticated, redirects to /login using <Navigate>
//     instead of window.location, so React Router keeps control
//     of the navigation (no full page reload)
//   - Renders <Outlet /> so it can wrap a whole group of nested
//     routes in App.tsx, not just a single page
// ============================================================
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Wraps all protected routes; redirects to /login if not authenticated
export function ProtectedRoute() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}