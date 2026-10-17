// ============================================================
// File: src/components/cattle/CattleTable.tsx
// Purpose: Full data table for the Cattle Inventory page
// Logic:
//   - Purely presentational: receives the already-fetched list
//     from useCattleList(), no fetching logic here
//   - Each row navigates to /cattle/:cattleId on click (Cattle
//     Detail page), per the routing table in Frontend Architecture
//   - Table headers use label-md styling in neutral, per DESIGN.md
//     Data Tables spec; numeric columns use tabular figures
//   - First column is "Cattle ID": a breed-initial avatar circle +
//     "#{cattleId}", built from CattleListItem's real fields only
//     (the SQL schema has no separate display-tag column, so the
//     raw numeric id is what's shown, matching the reference
//     mockup's layout without inventing data that doesn't exist)
//   - Wrapped in overflow-x-auto so the 7 columns scroll sideways on
//     phones instead of being clipped
// ============================================================
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { CattleListItem } from "@/types/cattle";
import { formatNumber, formatSex } from "@/utils/formatters";

interface CattleTableProps {
    cattle: CattleListItem[];
}

// Renders the cattle inventory as a clickable, sortable-ready table
export function CattleTable({ cattle }: CattleTableProps) {
    const navigate = useNavigate();

    if (cattle.length === 0) {
        return (
            <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-10 text-center">
                <p className="text-sm text-on-surface-variant">
                    No cattle match your search. Try adjusting the filters, or add a new animal.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-md border border-outline-variant bg-surface-container-lowest">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-outline-variant text-left">
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Cattle ID
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">Breed</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">Age</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">Weight</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">Sex</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Metabolic status
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Last emission
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant">
                    {cattle.map((animal) => (
                        <tr
                            key={animal.cattleId}
                            onClick={() => navigate(`/cattle/${animal.cattleId}`)}
                            className="cursor-pointer hover:bg-surface-container"
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-xs font-semibold text-primary">
                                        {animal.breed.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-on-surface">
                                        #{animal.cattleId}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">{animal.breed}</td>
                            <td className="px-4 py-3 tabular-nums text-on-surface-variant">
                                {animal.age}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface-variant">
                                {formatNumber(animal.weight)} kg
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">
                                {formatSex(animal.sex)}
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant">
                                {animal.metabolicStatus}
                            </td>
                            <td className="px-4 py-3">
                                {animal.latestEmissionLevel ? (
                                    <StatusBadge level={animal.latestEmissionLevel} />
                                ) : (
                                    <span className="text-xs text-on-surface-variant">No prediction yet</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}