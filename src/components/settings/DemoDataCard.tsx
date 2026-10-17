// ============================================================
// File: src/components/settings/DemoDataCard.tsx
// Purpose: Settings card, shown only in demo mode, that lets a visitor
//          wipe everything they added and start again from the sample data
// Logic:
//   - In demo mode all data lives in this browser's localStorage (see
//     src/mocks/demoDb.ts), so "reset" means deleting that entry, then
//     logging out and returning to the login page. The next sign-in
//     regenerates the original sample herd
//   - The mock database module is imported on click, so it is not part
//     of this component's initial code
//   - Needs an explicit second click (same two-step pattern as the
//     Danger zone) because it deletes the visitor's own entries
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Card explaining demo mode, with a two-step "Reset demo data" action
export function DemoDataCard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isConfirming, setIsConfirming] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Delete the stored demo database, sign out, and go to the login page
    async function handleReset() {
        setIsResetting(true);
        const { resetDemoDb } = await import("@/mocks/demoDb");
        resetDemoDb();
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" strokeWidth={2} />
                <h3 className="font-display text-base font-semibold text-on-surface">Demo data</h3>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
                This is a demo build: there is no server, and everything you add is stored only in this
                browser. Predictions come from a simple simulation, not the trained model.
            </p>

            {!isConfirming ? (
                <button
                    type="button"
                    onClick={() => setIsConfirming(true)}
                    className="mt-4 h-10 rounded-md border border-outline-variant px-4 text-sm font-medium text-on-surface hover:bg-surface-container"
                >
                    Reset demo data
                </button>
            ) : (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-on-surface">
                        Delete your changes and start over?
                    </span>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isResetting}
                        className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-on-primary hover:bg-primary-container disabled:opacity-60"
                    >
                        {isResetting ? "Resetting..." : "Yes, reset"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsConfirming(false)}
                        className="h-9 rounded-md border border-outline-variant px-3 text-sm font-medium text-on-surface hover:bg-surface-container"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
