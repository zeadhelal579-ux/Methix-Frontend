// ============================================================
// File: src/components/settings/FarmMetadataForm.tsx
// Purpose: Settings > "Core Metadata" card — edits the farm's
//          name
// Logic:
//   - Controlled form, local state seeded from the "farm" prop
//   - Only submits { name }, matching UpdateFarmDto exactly
//     (PUT /api/farms/{farmId})
//   - "Operational Status" is shown read-only here: changing it
//     is a separate, dedicated action (Settings > Danger Zone,
//     PUT /api/farms/{farmId}/status), so it must not be part
//     of this form's payload to avoid two places writing the
//     same field through two different endpoints
//   - Accepts an optional `error` (the failed mutation's error, if
//     any) so a failed save is visible instead of silently doing
//     nothing — this prop previously did not exist at all
// ============================================================
import { useState, type FormEvent } from "react";
import { FileText, Save } from "lucide-react";
import type { Farm, UpdateFarmDto } from "@/types/farm";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";

interface FarmMetadataFormProps {
    farm: Farm;
    onSave: (payload: UpdateFarmDto) => void;
    isSaving?: boolean;
    error?: unknown;
}

// Shared input classes, matching every other form field in the app
const INPUT_CLASSES =
    "h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

// Renders the farm's editable metadata form
export function FarmMetadataForm({ farm, onSave, isSaving = false, error }: FarmMetadataFormProps) {
    // Local form state, seeded once from the current farm values
    const [name, setName] = useState(farm.name);

    // Submit only the fields UpdateFarmDto expects
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        onSave({ name });
    }

    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
            <div className="mb-4 flex items-center gap-2 border-b border-outline-variant pb-4">
                <FileText className="h-4 w-4 text-primary" strokeWidth={2} />
                <h3 className="font-display text-base font-semibold text-on-surface">
                    Core Metadata
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-on-surface-variant">Facility Name</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={INPUT_CLASSES}
                    />
                </label>

                {/* Read-only: status changes go through Danger Zone's
                    dedicated status endpoint, not this form */}
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-on-surface-variant">
                        Operational Status
                    </span>
                    <input
                        type="text"
                        value={farm.operationalStatus}
                        disabled
                        readOnly
                        className={`${INPUT_CLASSES} cursor-not-allowed text-on-surface-variant`}
                    />
                </label>

                <div className="flex items-center justify-end gap-3">
                    {error != null && (
                        <p className="text-sm text-error" role="alert">
                            {getFriendlyErrorMessage(error, "Could not save changes. Please try again.")}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}