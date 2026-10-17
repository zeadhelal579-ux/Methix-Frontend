// ============================================================
// File: src/components/common/FarmBootstrapGuard.tsx
// Purpose: Route guard that ensures the logged-in user has a farm
//          before letting them reach Dashboard/Cattle/Predictions/
//          Settings — closes the "new user has farmId = null
//          forever" integration gap.
// Logic:
//   - Nested INSIDE ProtectedRoute, so a user is always
//     authenticated by the time this guard runs.
//   - Fast path: if FarmContext already has a farmId (returning
//     user, restored from localStorage), render <Outlet /> right
//     away with no network call.
//   - Slow path (farmId is null — first login on this device, or
//     a brand-new account): call GET /farms/me via useMyFarm.
//       - Found a farm  -> store it in FarmContext, then render.
//       - No farm (null) -> redirect to /create-farm.
//       - Genuine fetch error (500, network failure, etc.) -> show
//         an error state with a retry action, instead of treating
//         it the same as "confirmed no farm yet". getMyFarm() only
//         ever converts a real 404 into `null`; every other failure
//         still rejects and lands here as isError, so the two cases
//         must be told apart explicitly rather than both falling
//         through to "!myFarm".
//   - This is the single place that decides "does this user have
//     a farm yet", so Login.tsx/Register.tsx don't need to know
//     anything about farms — they just navigate to "/" and this
//     guard sorts out where the user actually needs to land.
// ============================================================
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useFarmContext } from "@/context/FarmContext";
import { useMyFarm } from "@/hooks/useFarm";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";

export function FarmBootstrapGuard() {
    const { farmId, setFarmId } = useFarmContext();

    // Only hits the network when we don't already know the farmId
    const { data: myFarm, isLoading, isFetched, isError, error, refetch, isRefetching } =
        useMyFarm(farmId === null);

    // Sync a freshly-discovered farmId into FarmContext (and
    // therefore localStorage) so this check never runs again
    // for this session.
    useEffect(() => {
        if (myFarm) {
            setFarmId(myFarm.farmId);
        }
    }, [myFarm, setFarmId]);

    // Already known — skip straight to the protected pages
    if (farmId !== null) {
        return <Outlet />;
    }

    // Still checking GET /farms/me for the first time this session
    if (isLoading || !isFetched) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-sm text-on-surface-variant">Loading your farm...</p>
            </div>
        );
    }

    // GET /farms/me genuinely failed (network issue, 500, etc.) — this is
    // NOT the same as "confirmed no farm yet", so show a retryable error
    // instead of silently redirecting into the create-farm flow
    if (isError) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
                <p className="text-sm text-error" role="alert">
                    {getFriendlyErrorMessage(error, "Could not check your farm. Please try again.")}
                </p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="rounded-md border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isRefetching ? "Retrying..." : "Retry"}
                </button>
            </div>
        );
    }

    // Checked, and the user genuinely has no farm yet
    if (!myFarm) {
        return <Navigate to="/create-farm" replace />;
    }

    // myFarm just arrived this render; the effect above will persist
    // it, but render Outlet immediately instead of waiting a tick
    return <Outlet />;
}