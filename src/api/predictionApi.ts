// ============================================================
// File: src/api/predictionApi.ts
// Purpose: All prediction-related backend calls
// Logic:
//   - Wraps PredictionController endpoints: running a prediction,
//     fetching filtered history, and exporting CSV
//   - Used by CattleDetail.tsx (run) and Predictions.tsx (history)
// ============================================================
import { axiosClient } from "./axiosClient";
import type { PagedResult } from "@/types/pagination";
import type {
    PredictionHistoryFilters,
    PredictionHistoryItem,
    PredictionResult,
} from "@/types/prediction";

// Run a full prediction for one animal (Cattle Detail > "Run Prediction Model")
// This single call orchestrates the AI Service on the backend side
export async function runPrediction(cattleId: number): Promise<PredictionResult> {
    const { data } = await axiosClient.post<PredictionResult>(`/cattle/${cattleId}/predict`);
    return data;
}

// Get the full, filterable prediction history (Predictions History page)
export async function getPredictionHistory(
    filters: PredictionHistoryFilters
): Promise<PagedResult<PredictionHistoryItem>> {
    const { data } = await axiosClient.get<PagedResult<PredictionHistoryItem>>("/predictions", {
        params: filters,
    });
    return data;
}
// Export the filtered prediction history as a downloadable CSV file
export async function exportPredictionHistory(
    filters: Omit<PredictionHistoryFilters, "page">
): Promise<Blob> {
    const { data } = await axiosClient.get("/predictions/export", {
        params: filters,
        responseType: "blob",
    });
    return data;
}