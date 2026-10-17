// ============================================================
// File: src/api/dashboardApi.ts
// Purpose: Single backend call powering the entire Dashboard page
// Logic:
//   - Wraps GET /api/dashboard/summary, which returns KPIs,
//     methane trend data, and recent predictions in one response
//     (avoids the frontend making 5-6 separate requests)
//   - Used only by Dashboard.tsx
// ============================================================
import { axiosClient } from "./axiosClient";
import type { EmissionLevel } from "@/types/cattle";

// A single point on the methane trend line chart
export interface MethaneTrendPoint {
    date: string;
    averageMethane: number;
}

// A recent prediction row shown on the Dashboard
export interface RecentPrediction {
    predictionId: number;
    cattleBreed: string;
    predictedMethaneAmount: number;
    emissionLevel: EmissionLevel;
    date: string;
}

// Full shape returned by GET /api/dashboard/summary
export interface DashboardSummary {
    totalCattle: number;
    averageMethane: number;
    highEmissionCount: number;
    trend: MethaneTrendPoint[];
    recentPredictions: RecentPrediction[];
}

// Get all Dashboard KPIs, trend chart data, and recent predictions in one call
export async function getDashboardSummary(
    farmId: number,
    range: "7d" | "30d" = "7d"
): Promise<DashboardSummary> {
    const { data } = await axiosClient.get<DashboardSummary>("/dashboard/summary", {
        params: { farmId, range },
    });
    return data;
}