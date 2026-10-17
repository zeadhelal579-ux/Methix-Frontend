// ============================================================
// File: src/hooks/useCattleDetail.ts
// Purpose: Fetch a single animal's details + feed records, and
//          expose mutations to edit cattle / add feed records
//          (Cattle Detail page)
// Logic:
//   - Two separate queries (cattle + feed records) so each can
//     load/error independently, matching CattleDetail.tsx pulling
//     both cattleApi.getById() and the feed-records endpoint
//   - Mutations invalidate their respective query on success
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createFeedRecord,
    getCattleById,
    getFeedRecords,
    updateCattle,
} from "@/api/cattleApi";
import type { CreateFeedRecordDto, UpdateCattleDto } from "@/types/cattle";

export function useCattleDetail(cattleId: number) {
    return useQuery({
        queryKey: ["cattle", cattleId],
        queryFn: () => getCattleById(cattleId),
        enabled: !!cattleId,
    });
}

export function useFeedRecords(cattleId: number) {
    return useQuery({
        queryKey: ["feed-records", cattleId],
        queryFn: () => getFeedRecords(cattleId),
        enabled: !!cattleId,
    });
}

export function useUpdateCattle(cattleId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateCattleDto) => updateCattle(cattleId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cattle", cattleId] });
        },
    });
}

export function useCreateFeedRecord(cattleId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateFeedRecordDto) => createFeedRecord(cattleId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed-records", cattleId] });
        },
    });
}