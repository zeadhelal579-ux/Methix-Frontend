// ============================================================
// File: src/hooks/useCattleList.ts
// Purpose: Fetch the paginated/filterable cattle list (Cattle
//          Inventory page) and expose a mutation to add cattle
// Logic:
//   - useQuery key includes all filter params, so changing search
//     text, level filter, or page number triggers an automatic,
//     cached refetch (no manual useEffect needed)
//   - useMutation for createCattle invalidates the list query on
//     success, so the new animal appears immediately (React Query
//     auto-refetch rule from Frontend Architecture)
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCattle, getCattleList, type CattleListParams } from "@/api/cattleApi";
import type { CreateCattleDto } from "@/types/cattle";

export function useCattleList(params: CattleListParams) {
    return useQuery({
        queryKey: ["cattle-list", params],
        queryFn: () => getCattleList(params),
    });
}

export function useCreateCattle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCattleDto) => createCattle(payload),
        // Refetch the cattle list after successfully adding a new animal
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cattle-list"] });
        },
    });
}