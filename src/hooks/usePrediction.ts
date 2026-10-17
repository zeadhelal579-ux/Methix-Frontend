// ============================================================
// File: src/hooks/usePrediction.ts
// Purpose: Mutation for running a prediction on the Cattle
//          Detail page ("Run Prediction Model" button)
// Logic:
//   - On success, invalidates the cattle list (so its last
//     emission level badge updates), the dashboard summary
//     (KPIs must reflect the new prediction immediately) and the
//     prediction history (so the new row shows up in the table)
// ============================================================
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runPrediction } from "@/api/predictionApi";

// Run a full prediction for one animal, then refresh dependent queries
export function useRunPrediction(cattleId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => runPrediction(cattleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cattle-list"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
            queryClient.invalidateQueries({ queryKey: ["prediction-history"] });
        },
    });
}