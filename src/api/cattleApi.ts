// ============================================================
// File: src/api/cattleApi.ts
// Purpose: All cattle and feed-record backend calls
// Logic:
//   - Wraps CattleController + FeedRecordController endpoints
//   - Used by CattleList.tsx and CattleDetail.tsx
// ============================================================
import { axiosClient } from "./axiosClient";
import type { PagedResult } from "@/types/pagination";
import type {
    CattleDetail,
    CattleListItem,
    CreateCattleDto,
    CreateFeedRecordDto,
    FeedRecord,
    UpdateCattleDto,
} from "@/types/cattle";

// Query params for the cattle list (search, filter, pagination)
export interface CattleListParams {
    farmId: number;
    search?: string;
    level?: string;
    page?: number;
}

// Get the paginated, filterable cattle list (Cattle Inventory page)
export async function getCattleList(
    params: CattleListParams
): Promise<PagedResult<CattleListItem>> {
    const { data } = await axiosClient.get<PagedResult<CattleListItem>>("/cattle", { params });
    return data;
}

// Get full details of a single animal (Cattle Detail page)
export async function getCattleById(cattleId: number): Promise<CattleDetail> {
    const { data } = await axiosClient.get<CattleDetail>(`/cattle/${cattleId}`);
    return data;
}

// Add a new animal (Cattle Inventory > Add cattle)
export async function createCattle(payload: CreateCattleDto): Promise<CattleDetail> {
    const { data } = await axiosClient.post<CattleDetail>("/cattle", payload);
    return data;
}

// Update an existing animal (Cattle Detail > Edit)
export async function updateCattle(cattleId: number, payload: UpdateCattleDto): Promise<CattleDetail> {
    const { data } = await axiosClient.put<CattleDetail>(`/cattle/${cattleId}`, payload);
    return data;
}

// Get the full feed record history for an animal (Cattle Detail > Feed table)
export async function getFeedRecords(cattleId: number): Promise<FeedRecord[]> {
    const { data } = await axiosClient.get<FeedRecord[]>(`/cattle/${cattleId}/feed-records`);
    return data;
}

// Add a new feed record (Cattle Detail > Add Record)
export async function createFeedRecord(
    cattleId: number,
    payload: CreateFeedRecordDto
): Promise<FeedRecord> {
    const { data } = await axiosClient.post<FeedRecord>(`/cattle/${cattleId}/feed-records`, payload);
    return data;
}