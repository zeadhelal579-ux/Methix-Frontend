// ============================================================
// File: src/pages/CreateFarm.tsx
// Purpose: One-time onboarding page for a user who just registered
//          (or logged in) and does not belong to a farm yet.
// Logic:
//   - Rendered outside AppLayout, like Login/Register — there is
//     no farm yet, so Sidebar/Topbar (which assume one) can't
//     render meaningfully here.
//   - Reached only via FarmBootstrapGuard's redirect, never linked
//     to directly from the rest of the app.
//   - On submit: POST /api/farms (useCreateFarm), then store the
//     new farmId in FarmContext so every other page/hook that
//     reads farmId immediately sees it, then navigate to "/".
// ============================================================
import { useState, type FormEvent } from "react";
import { ArrowRight, Tractor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFarmContext } from "@/context/FarmContext";
import { useAuthContext } from "@/context/AuthContext";
import { useCreateFarm } from "@/hooks/useFarm";

export default function CreateFarm() {
    const navigate = useNavigate();
    const { setFarmId } = useFarmContext();
    const { user, login } = useAuthContext();
    const { mutateAsync: createFarm, isPending, error } = useCreateFarm();

    const [name, setName] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        try {
            const farm = await createFarm({ name });

            // BUG FIX: the backend just promoted this user to "Admin", but
            // the token they're still holding (from Login/Register) carries
            // the old "Farmer" claim. Store the fresh token the backend
            // returns so an immediate "Add team member" doesn't 403 — see
            // CreateFarmResponse in types/farm.ts for the full reasoning.
            if (user) {
                login({ token: farm.token, user: { ...user, role: "Admin" } });
            }

            setFarmId(farm.farmId);
            navigate("/");
        } catch {
            // Error is already exposed via `error` below; nothing else to do
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm rounded-md border border-outline-variant bg-surface-container-lowest p-8">
                <div className="text-center">
                    <Tractor className="mx-auto h-8 w-8 text-primary" strokeWidth={2} />
                    <h1 className="mt-2 font-display text-2xl font-bold text-primary">
                        Set up your farm
                    </h1>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        One last step before your dashboard is ready.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-on-surface-variant">
                            Farm name
                        </span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Green Valley Dairy"
                            required
                            autoFocus
                            className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </label>

                    {error && (
                        <p className="text-sm text-error" role="alert">
                            Could not create the farm. Please try again.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending ? "Creating farm..." : "Create farm"}
                        {!isPending && <ArrowRight className="h-4 w-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}