// ============================================================
// File: src/components/dashboard/RecentPredictionsList.tsx
// Purpose: Compact list of the most recent predictions, shown
//          on the Dashboard (not the full history table)
// Logic:
//   - Reuses StatusBadge for consistent emission-level coloring
//   - Purely presentational: receives the already-fetched list
//     from useDashboard(), no data fetching of its own
// ============================================================
import { StatusBadge } from "@/components/common/StatusBadge";
import type { RecentPrediction } from "@/api/dashboardApi";
import { formatDate, formatMethaneAmount } from "@/utils/formatters";

interface RecentPredictionsListProps {
    predictions: RecentPrediction[];
}

// Renders a short list of the latest predictions across the farm
export function RecentPredictionsList({ predictions }: RecentPredictionsListProps) {
    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
            <h3 className="font-display text-base font-semibold text-on-surface">
                Recent predictions
            </h3>

            <div className="mt-4 flex flex-col divide-y divide-outline-variant">
                {predictions.length === 0 && (
                    <p className="py-6 text-center text-sm text-on-surface-variant">
                        No predictions yet. Run one from a cattle profile to see it here.
                    </p>
                )}

                {predictions.map((prediction) => (
                    <div
                        key={prediction.predictionId}
                        className="flex items-center justify-between py-3"
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-on-surface">
                                {prediction.cattleBreed}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                                {formatDate(prediction.date)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm tabular-nums text-on-surface">
                                {formatMethaneAmount(prediction.predictedMethaneAmount)}
                            </span>
                            <StatusBadge level={prediction.emissionLevel} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}