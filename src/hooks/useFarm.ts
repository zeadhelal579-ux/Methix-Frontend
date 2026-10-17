// ============================================================
// File: src/hooks/useFarm.ts
// Purpose: Fetch the current farm's details (Settings, Topbar),
//          and expose mutations to update its metadata/status
// Logic:
//   - useFarm: wraps farmApi.getFarm in useQuery, keyed by farmId
//     so switching farms in FarmContext automatically refetches
//     ("enabled: !!farmId" prevents firing before a farm is chosen)
//   - useUpdateFarm / useUpdateFarmStatus: both invalidate the
//     ["farm", farmId] query on success, so Settings.tsx always
//     reflects the latest saved value without manual refetch calls
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFarm, getFarm, getMyFarm, updateFarm, updateFarmStatus } from "@/api/farmApi";
import type { CreateFarmDto, UpdateFarmDto } from "@/types/farm";

// Check whether the current user already belongs to a farm.
// "enabled" lets the caller (FarmBootstrapGuard) skip the network
// call entirely once a farmId is already known.
export function useMyFarm(enabled: boolean) {
    return useQuery({
        queryKey: ["farm", "me"],
        queryFn: getMyFarm,
        enabled,
    });
}

// Create the current user's first farm — CreateFarm.tsx onboarding form
export function useCreateFarm() {
    return useMutation({
        mutationFn: (payload: CreateFarmDto) => createFarm(payload),
    });
}

// Fetch the current farm's details, keyed by farmId
export function useFarm(farmId: number | null) {
    return useQuery({
        queryKey: ["farm", farmId],
        queryFn: () => getFarm(farmId as number),
        enabled: !!farmId,
    });
}

// Save farm metadata (name) — Settings > Core Metadata
export function useUpdateFarm(farmId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateFarmDto) => updateFarm(farmId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
        },
    });
}

// Toggle the farm's operational status — Settings > Danger Zone
export function useUpdateFarmStatus(farmId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (status: string) => updateFarmStatus(farmId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
        },
    });
}