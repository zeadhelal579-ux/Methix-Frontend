// ============================================================
// File: src/components/predictions/ExplanationChart.tsx
// Purpose: Horizontal bar chart visualizing SHAP factor impact —
//          the core "Why this result" explainability feature
// Logic:
//   - Uses Recharts horizontal BarChart, per DESIGN.md's "XAI Bar
//     Charts" spec: semantic colors for positive/negative impact
//     (red-ish = increased methane, green-ish = decreased it),
//     not a flat single color, since the sign carries meaning
//   - Sorted by absolute impact so the most influential factor
//     (positive or negative) appears first — this ordering
//     carries real information, unlike a decorative numbered list
// ============================================================
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { TopContributor } from "@/types/prediction";

interface ExplanationChartProps {
    factors: TopContributor[];
}

// Renders SHAP explanation factors as a horizontal, semantically-colored bar chart
export function ExplanationChart({ factors }: ExplanationChartProps) {
    // Sort by absolute impact, largest influence first (most useful reading order)
    const sorted = [...factors].sort(
        (a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue)
    );

    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
            {/* Title + short explainer of what the chart represents */}
            <h3 className="font-display text-base font-semibold text-on-surface">
                Why this result
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
                Each factor's contribution to the predicted methane amount, in grams/day.
            </p>

            {/* Chart height grows with the number of factors, so bars never
                get cramped regardless of how many SHAP factors are returned */}
            <ResponsiveContainer width="100%" height={sorted.length * 44 + 20} className="mt-4">
                <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" horizontal={false} />

                    {/* X axis: numeric grams/day scale */}
                    <XAxis
                        type="number"
                        tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
                        axisLine={{ stroke: "var(--color-outline-variant)" }}
                        tickLine={false}
                    />

                    {/* Y axis: factor names (category axis, since this is
                        a horizontal bar chart) */}
                    <YAxis
                        type="category"
                        dataKey="feature"
                        width={140}
                        tick={{ fontSize: 12, fill: "var(--color-on-surface)" }}
                        axisLine={false}
                        tickLine={false}
                    />

                    {/* Tooltip: shows the signed value and a plain-language
                        label (increased/decreased) instead of raw numbers */}
                    <Tooltip
                        formatter={(value) => {
                            const num = Number(value);
                            return [
                                `${num > 0 ? "+" : ""}${num.toFixed(1)} g/day`,
                                num > 0 ? "Increases methane" : "Decreases methane",
                            ];
                        }}
                        contentStyle={{
                            backgroundColor: "var(--color-surface-container-lowest)",
                            border: "1px solid var(--color-outline-variant)",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                        }}
                    />

                    {/* Bars: each cell colored individually based on its
                        sign — red for factors that increased methane,
                        green for factors that decreased it */}
                    <Bar dataKey="shapValue" radius={[0, 4, 4, 0]}>
                        {sorted.map((entry) => (
                            <Cell
                                key={entry.feature}
                                fill={
                                    entry.direction === "increases"
                                        ? "var(--color-emission-high)"
                                        : "var(--color-emission-low)"
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}