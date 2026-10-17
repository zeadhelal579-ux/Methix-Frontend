// ============================================================
// File: src/pages/Settings.tsx
// Purpose: Farm settings page — core metadata, personnel access,
//          and a danger zone for archiving the farm
// Logic:
//   - Combines useFarm (read) + useUpdateFarm/useUpdateFarmStatus
//     (write) + usePersonnel (team management), all consistent
//     React Query hooks living in hooks/, per project convention
//   - Danger Zone action (archive/reactivate) requires an explicit
//     confirm click before firing, since it's a destructive,
//     farm-wide action. confirmingArchive resets to false only on
//     a successful mutate() call, so a failed request leaves the
//     "Are you sure?" prompt open instead of silently vanishing.
//   - In demo mode, a "Demo data" card (reset button) is shown
//     between the team card and the Danger zone
//   - addPersonnel.error is passed down to PersonnelAccessCard so
//     a failed add (duplicate email, non-Admin, network error)
//     shows a clear message instead of failing silently; the
//     onSuccess callback is forwarded through so the form only
//     resets/closes on an actual success
// ============================================================
import { useState } from "react";
import { useFarmContext } from "@/context/FarmContext";
import { useFarm, useUpdateFarm, useUpdateFarmStatus } from "@/hooks/useFarm";
import { useAddPersonnel, usePersonnel } from "@/hooks/usePersonnel";
import { FarmMetadataForm } from "@/components/settings/FarmMetadataForm";
import { PersonnelAccessCard } from "@/components/settings/PersonnelAccessCard";
import { DemoDataCard } from "@/components/settings/DemoDataCard";
import { DEMO_MODE } from "@/config/env";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";
export default function Settings() {
    const { farmId } = useFarmContext();
    const id = farmId as number;

    const { data: farm, isLoading: isFarmLoading, isError: isFarmError, error: farmError } = useFarm(farmId);
    const { data: personnel, isLoading: isPersonnelLoading } = usePersonnel(farmId);
    const addPersonnel = useAddPersonnel(id);
    const updateFarmMutation = useUpdateFarm(id);
    const updateStatusMutation = useUpdateFarmStatus(id);

    const [confirmingArchive, setConfirmingArchive] = useState(false);

    const isArchived = farm?.operationalStatus?.toLowerCase().includes("archived");

    if (isFarmLoading) {
        return <p className="text-sm text-on-surface-variant">Loading settings...</p>;
    }

    if (isFarmError || !farm) {
        return (
            <p className="text-sm text-error" role="alert">
                {getFriendlyErrorMessage(farmError, "Could not load farm settings.")}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="font-display text-2xl font-semibold text-on-surface">Settings</h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                    Manage your farm's details, team access, and status.
                </p>
            </div>

            <FarmMetadataForm
                farm={farm}
                onSave={(payload) => updateFarmMutation.mutate(payload)}
                isSaving={updateFarmMutation.isPending}
                error={updateFarmMutation.error}
            />

            {isPersonnelLoading ? (
                <p className="text-sm text-on-surface-variant">Loading team...</p>
            ) : (
                <PersonnelAccessCard
                    personnel={personnel ?? []}
                    onAdd={(payload, options) => addPersonnel.mutate(payload, options)}
                    isAdding={addPersonnel.isPending}
                    addError={addPersonnel.error}
                />
            )}

            {DEMO_MODE && <DemoDataCard />}

            <div className="rounded-md border border-error/30 bg-error-container/10 p-5">
                <h3 className="font-display text-base font-semibold text-on-surface">Danger zone</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                    {isArchived
                        ? "This farm is archived. Reactivate it to resume tracking."
                        : "Archiving this farm hides it from the dashboard and stops new predictions."}
                </p>

                {!confirmingArchive ? (
                    <button
                        type="button"
                        onClick={() => setConfirmingArchive(true)}
                        className="mt-4 h-10 rounded-md border border-error px-4 text-sm font-medium text-error hover:bg-error-container/20"
                    >
                        {isArchived ? "Reactivate farm" : "Archive farm"}
                    </button>
                ) : (
                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-sm font-medium text-on-surface">Are you sure?</span>
                        <button
                            type="button"
                            onClick={() =>
                                updateStatusMutation.mutate(
                                    isArchived ? "Active - Monitoring" : "Archived",
                                    { onSuccess: () => setConfirmingArchive(false) }
                                )
                            }
                            disabled={updateStatusMutation.isPending}
                            className="h-9 rounded-md bg-error px-3 text-sm font-medium text-on-error hover:opacity-90 disabled:opacity-60"
                        >
                            {updateStatusMutation.isPending
                                ? "Working..."
                                : isArchived
                                    ? "Yes, reactivate"
                                    : "Yes, archive"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmingArchive(false)}
                            className="h-9 rounded-md border border-outline-variant px-3 text-sm font-medium text-on-surface hover:bg-surface-container"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {updateStatusMutation.isError && (
                    <p className="mt-3 text-sm text-error" role="alert">
                        {getFriendlyErrorMessage(
                            updateStatusMutation.error,
                            "Could not update the farm's status. Please try again."
                        )}
                    </p>
                )}
            </div>
        </div>
    );
}