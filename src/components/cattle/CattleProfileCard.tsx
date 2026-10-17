// ============================================================
// File: src/components/cattle/CattleProfileCard.tsx
// Purpose: Card showing one animal's core static details on the
//          Cattle Detail page, including the AI model's animal-
//          level input features (Sex, DIM, Milk metrics,
//          Metabolic Status)
// Logic:
//   - Purely presentational: receives CattleDetail from
//     useCattleDetail(cattleId), no fetching logic here
//   - Renders each field as a labeled stat, consistent with the
//     "Structural Layering" elevation spec (border, no shadow)
// ============================================================
import type { CattleDetail } from "@/types/cattle";
import { formatNumber, formatSex } from "@/utils/formatters";

interface CattleProfileCardProps {
    cattle: CattleDetail;
}

// A single labeled field inside the profile card
function ProfileField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-on-surface-variant">{label}</span>
            <span className="text-sm tabular-nums text-on-surface">{value}</span>
        </div>
    );
}

// Displays breed, age, weight, sex, DIM, milk metrics, and metabolic
// status for one animal — the full set of the AI model's animal-level
// input features
export function CattleProfileCard({ cattle }: CattleProfileCardProps) {
    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
            <h3 className="font-display text-base font-semibold text-on-surface">
                {cattle.breed} — #{cattle.cattleId}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <ProfileField label="Age" value={`${cattle.age} months`} />
                <ProfileField label="Weight" value={`${formatNumber(cattle.weight)} kg`} />
                <ProfileField label="Sex" value={formatSex(cattle.sex)} />
                <ProfileField label="Metabolic status" value={cattle.metabolicStatus} />
                <ProfileField label="DIM" value={`${cattle.dim} days`} />
                <ProfileField label="Milk yield" value={`${formatNumber(cattle.milkKgDay)} kg/day`} />
                <ProfileField label="Milk fat" value={`${formatNumber(cattle.milkFatPct)}%`} />
                <ProfileField label="Milk lactose" value={`${formatNumber(cattle.milkLactosePct)}%`} />
                <ProfileField label="Farm ID" value={`#${cattle.farmId}`} />
            </div>
        </div>
    );
}