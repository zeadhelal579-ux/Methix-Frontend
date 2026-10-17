// ============================================================
// File: src/hooks/useDashboard.ts
// Purpose: Fetch all Dashboard page data in one query
// Logic:
//   - Wraps the single GET /api/dashboard/summary call
//   - "range" is passed through so the KPI/trend chart period
//     toggle (7d / 30d) triggers an automatic refetch
// ============================================================
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/api/dashboardApi";

// Fetch the Dashboard's KPIs, trend chart data, and recent predictions
export function useDashboard(farmId: number | null, range: "7d" | "30d" = "7d") {
    return useQuery({
        queryKey: ["dashboard-summary", farmId, range],
        queryFn: () => getDashboardSummary(farmId as number, range),
        enabled: !!farmId,
    });
}