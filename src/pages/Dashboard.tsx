// ============================================================
// File: src/pages/Dashboard.tsx
// Purpose: Main landing page after login — farm-wide KPIs,
//          methane trend chart, and recent predictions
// Logic:
//   - Reads the active farm from FarmContext, fetches all
//     dashboard data in a single call via useDashboard()
//   - "range" (7d/30d) is local UI state that drives the trend
//     chart period; changing it triggers an automatic refetch
//     through the hook's queryKey (no manual effect needed)
//   - Loading/empty states are handled explicitly, not silently
// ============================================================
import { useState } from "react";
import { Beef, Gauge, TriangleAlert } from "lucide-react";
import { useFarmContext } from "@/context/FarmContext";
import { useDashboard } from "@/hooks/useDashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MethaneTrendChart } from "@/components/dashboard/MethaneTrendChart";
import { RecentPredictionsList } from "@/components/dashboard/RecentPredictionsList";
import { formatMethaneAmount } from "@/utils/formatters";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";
export default function Dashboard() {
    const { farmId } = useFarmContext();
    const [range, setRange] = useState<"7d" | "30d">("7d");
    const { data, isLoading, isError, error } = useDashboard(farmId, range);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-semibold text-on-surface">Dashboard</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        An overview of methane emissions across your farm.
                    </p>
                </div>

                <div className="flex items-center gap-1 rounded-md border border-outline-variant p-1">
                    {(["7d", "30d"] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setRange(option)}
                            className={`rounded px-3 py-1.5 text-sm font-medium ${range === option
                                ? "bg-primary text-on-primary"
                                : "text-on-surface-variant hover:bg-surface-container"
                                }`}
                        >
                            {option === "7d" ? "7 days" : "30 days"}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading && (
                <p className="text-sm text-on-surface-variant">Loading dashboard data...</p>
            )}

            {isError && (
                <p className="text-sm text-error" role="alert">
                    {getFriendlyErrorMessage(error, "Could not load dashboard data. Please try again shortly.")}
                </p>
            )}

            {data && (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <KpiCard label="Total cattle" value={String(data.totalCattle)} icon={Beef} />
                        <KpiCard
                            label="Average methane"
                            value={formatMethaneAmount(data.averageMethane)}
                            icon={Gauge}
                        />
                        <KpiCard
                            label="High risk cattle"
                            value={String(data.highEmissionCount)}
                            icon={TriangleAlert}
                            variant="danger"
                        />
                    </div>

                    <MethaneTrendChart data={data.trend} />

                    <RecentPredictionsList predictions={data.recentPredictions} />
                </>
            )}
        </div>
    );
}