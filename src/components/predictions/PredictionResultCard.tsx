// ============================================================
// File: src/components/predictions/PredictionResultCard.tsx
// Purpose: Highlight card showing the headline predicted methane
//          number + classification, right after running a
//          prediction on the Cattle Detail page
// Logic:
//   - Purely presentational: receives a PredictionResult
//   - The number itself is the hero here (largest text on the
//     page), since it's the single most important output of
//     the whole product
// ============================================================
import { StatusBadge } from "@/components/common/StatusBadge";
import type { PredictionResult } from "@/types/prediction";

interface PredictionResultCardProps {
    result: PredictionResult;
}

// Displays the predicted methane amount as the primary result
export function PredictionResultCard({ result }: PredictionResultCardProps) {
    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6">
            {/* Header row: label + emission classification badge */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface-variant">
                    Predicted methane emission
                </span>
                <StatusBadge level={result.emissionLevel} />
            </div>

            {/* Hero number: largest text on the page, the single most
                important output of the whole product */}
            <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold tabular-nums text-on-surface">
                    {result.predictedMethaneAmount.toFixed(1)}
                </span>
                <span className="text-sm text-on-surface-variant">g / day</span>
            </div>

            {/* Secondary metadata: model version, for traceability,
                kept visually small/secondary */}
            <div className="mt-4 flex items-center gap-4 text-xs text-on-surface-variant">
                <span>Model {result.modelVersion}</span>
            </div>

            {/* Threshold gauge: visualizes where the predicted amount sits
                relative to the AI model's dynamic Low/High cutoffs
                (riskThresholds), instead of the old hardcoded 200/400 */}
            <ThresholdGauge
                value={result.predictedMethaneAmount}
                low={result.riskThresholds.low}
                high={result.riskThresholds.high}
            />
        </div>
    );
}

interface ThresholdGaugeProps {
    value: number;
    low: number;
    high: number;
}

// Three-zone horizontal bar (Low / Moderate / High) with a marker showing
// exactly where the current prediction falls between the model's own
// data-driven cutoffs
function ThresholdGauge({ value, low, high }: ThresholdGaugeProps) {
    // Scale extends a bit past "high" so the High zone isn't a sliver,
    // and values above it still render inside the visible track
    const scaleMax = Math.max(high * 1.5, value);
    const lowPct = (low / scaleMax) * 100;
    const highPct = (high / scaleMax) * 100;
    const markerPct = Math.min((value / scaleMax) * 100, 100);

    return (
        <div className="mt-4">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
                <div
                    className="absolute inset-y-0 left-0 bg-emission-low/40"
                    style={{ width: `${lowPct}%` }}
                />
                <div
                    className="absolute inset-y-0 bg-emission-moderate/40"
                    style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
                />
                <div
                    className="absolute inset-y-0 bg-emission-high/40"
                    style={{ left: `${highPct}%`, right: 0 }}
                />
                {/* Marker: current prediction's exact position on the scale */}
                <div
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-container-lowest bg-on-surface"
                    style={{ left: `${markerPct}%` }}
                />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-on-surface-variant">
                <span>0</span>
                <span>Low &lt; {low.toFixed(0)}</span>
                <span>High &gt; {high.toFixed(0)}</span>
            </div>
        </div>
    );
}