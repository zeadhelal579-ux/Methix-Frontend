// ============================================================
// File: src/hooks/usePredictionHistory.ts
// Purpose: Fetch the filterable prediction history table data
//          and trigger CSV export (Predictions History page)
// Logic:
//   - useQuery keyed by all filters, same auto-refetch pattern
//     as useCattleList
//   - Export is a plain async function (not a query/mutation)
//     since it just triggers a file download, no cached state
//     or server-side side effect to track
//   - The temporary download link is attached to the page and the
//     object URL is released after a short delay: revoking it
//     immediately can cancel the download in Safari and Firefox
// ============================================================
import { useQuery } from "@tanstack/react-query";
import { exportPredictionHistory, getPredictionHistory } from "@/api/predictionApi";
import type { PredictionHistoryFilters } from "@/types/prediction";

// Fetch the prediction history table rows for the given filters
export function usePredictionHistory(filters: PredictionHistoryFilters) {
    return useQuery({
        queryKey: ["prediction-history", filters],
        queryFn: () => getPredictionHistory(filters),
    });
}

// Downloads the filtered history as a CSV file in the browser
export async function downloadPredictionHistoryCsv(
    filters: Omit<PredictionHistoryFilters, "page">
) {
    const blob = await exportPredictionHistory(filters);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "predictions-history.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}