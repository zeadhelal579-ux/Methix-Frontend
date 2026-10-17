// ============================================================
// File: src/hooks/usePersonnel.ts
// Purpose: Fetch the team list and add new members (Settings page)
// Logic:
//   - Standard query + mutation pair, same invalidate-on-success
//     pattern as the other hooks in this folder
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addPersonnel, getPersonnel } from "@/api/farmApi";
import type { AddPersonnelDto } from "@/types/farm";

// Fetch the farm's personnel/team list
export function usePersonnel(farmId: number | null) {
    return useQuery({
        queryKey: ["personnel", farmId],
        queryFn: () => getPersonnel(farmId as number),
        enabled: !!farmId,
    });
}

// Add a new team member, then refetch the personnel list
export function useAddPersonnel(farmId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: AddPersonnelDto) => addPersonnel(farmId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personnel", farmId] });
        },
    });
}