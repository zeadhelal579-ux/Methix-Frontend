// ============================================================
// File: src/types/pagination.ts
// Purpose: Shared shape for any paginated backend response
// Logic:
//   - Matches the backend's PagedResultDto<T> exactly:
//     { items, totalCount, page, pageSize }
//   - Used by cattleApi.ts and predictionApi.ts instead of each
//     assuming a raw array, since GET /api/cattle and
//     GET /api/predictions both wrap their results this way
// ============================================================
export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}