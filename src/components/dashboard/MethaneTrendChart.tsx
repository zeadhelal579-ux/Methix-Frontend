// ============================================================
// File: src/components/dashboard/MethaneTrendChart.tsx
// Purpose: Line chart showing average methane emissions over
//          time (Dashboard page)
// Logic:
//   - Uses Recharts, per Tech Stack decision
//   - 2px stroke width + gradient area-fill under the line,
//     exactly as specified in DESIGN.md's "Line Trends" spec
//   - Reads data directly from useDashboard()'s "trend" field,
//     no local transformation needed since the backend already
//     returns it pre-aggregated
//   - The tooltip shows the plain average for the hovered day. (It
//     used to reuse the SHAP chart's "+x increases / decreases"
//     wording, which is wrong here: these are absolute averages,
//     never signed deltas, so every point read as "Increased")
// ============================================================
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { MethaneTrendPoint } from "@/api/dashboardApi";
import { formatDate } from "@/utils/formatters";

interface MethaneTrendChartProps {
    data: MethaneTrendPoint[];
}

// Renders the methane trend as an area line chart with teal gradient fill
export function MethaneTrendChart({ data }: MethaneTrendChartProps) {
    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
            <h3 className="font-display text-base font-semibold text-on-surface">
                Methane trend
            </h3>

            <ResponsiveContainer width="100%" height={260} className="mt-4">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="methaneGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />

                    <XAxis
                        dataKey="date"
                        tickFormatter={(value: string) => formatDate(value)}
                        tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
                        axisLine={{ stroke: "var(--color-outline-variant)" }}
                        tickLine={false}
                    />

                    <YAxis
                        tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)} g/day`, "Average methane"]}
                        labelFormatter={(label) => formatDate(String(label))}
                        contentStyle={{
                            backgroundColor: "var(--color-surface-container-lowest)",
                            border: "1px solid var(--color-outline-variant)",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="averageMethane"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        fill="url(#methaneGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}