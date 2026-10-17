// ============================================================
// File: src/components/predictions/PredictionsHistoryTable.tsx
// Purpose: Full, filterable table of all past predictions
//          (Predictions History page)
// Logic:
//   - Purely presentational: receives records from
//     usePredictionHistory(filters), no fetching logic here
//   - Reuses StatusBadge for consistent emission-level coloring,
//     same pattern as every other table in the app
//   - Column order matches the Predictions mockup: Date, Cattle
//     ID, Predicted Methane (g/day), Emission Level — "Cattle ID"
//     replaces the earlier breed-only display since the id is
//     what uniquely identifies the animal in a farm-wide history
//     table
//   - Wrapped in overflow-x-auto so the table scrolls sideways on
//     phones instead of being clipped
// ============================================================
import { StatusBadge } from "@/components/common/StatusBadge";
import type { PredictionHistoryItem } from "@/types/prediction";
import { formatDate, formatMethaneAmount } from "@/utils/formatters";

interface PredictionsHistoryTableProps {
    predictions: PredictionHistoryItem[];
}

// Renders the full prediction history as a table
export function PredictionsHistoryTable({ predictions }: PredictionsHistoryTableProps) {
    // Empty state: shown when the current filters return no results,
    // instead of rendering an empty table shell
    if (predictions.length === 0) {
        return (
            <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-10 text-center">
                <p className="text-sm text-on-surface-variant">
                    No predictions match your filters.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-md border border-outline-variant bg-surface-container-lowest">
            <table className="w-full text-sm">
                {/* Table header: label-md styling in neutral, per DESIGN.md */}
                <thead>
                    <tr className="border-b border-outline-variant text-left">
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">Date</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Cattle ID
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Predicted methane (g/day)
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Emission level
                        </th>
                    </tr>
                </thead>

                {/* Table body: one row per past prediction, reusing
                    StatusBadge for the emission level column */}
                <tbody className="divide-y divide-outline-variant">
                    {predictions.map((prediction) => (
                        <tr key={prediction.predictionId}>
                            <td className="px-4 py-3 text-on-surface-variant">
                                {formatDate(prediction.date)}
                            </td>
                            <td className="px-4 py-3 font-medium text-on-surface">
                                #{prediction.cattleId}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatMethaneAmount(prediction.predictedMethaneAmount)}
                            </td>
                            <td className="px-4 py-3">
                                <StatusBadge level={prediction.emissionLevel} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}