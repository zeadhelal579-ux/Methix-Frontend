// ============================================================
// File: src/pages/Predictions.tsx
// Purpose: Predictions History page — full, filterable table of
//          every prediction ever run, with CSV export
// Logic:
//   - level and date range filters are local UI state, part of
//     usePredictionHistory's queryKey, so changing them triggers
//     an automatic refetch (dateFrom/dateTo are real backend
//     params per Backend-Architecture's GET /api/predictions)
//   - Backend returns a paged result { items, totalCount, page,
//     pageSize } for GET /api/predictions, so totalPages is
//     computed from the real totalCount/pageSize
//   - The Cattle ID search box filters client-side, within the
//     current page's items only: GET /api/predictions has no
//     ?search= param documented in Backend-Architecture, so a
//     true farm-wide search isn't possible yet
//   - Export button calls downloadPredictionHistoryCsv directly
//     (not a query/mutation) since it's a one-off file download,
//     not cached state
//   - Export button shows a brief "Exporting..." state while the
//     request is in flight, using local isExporting state; a failed
//     export shows a visible message instead of failing silently
// ============================================================
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useFarmContext } from "@/context/FarmContext";
import { usePredictionHistory, downloadPredictionHistoryCsv } from "@/hooks/usePredictionHistory";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { PredictionsHistoryTable } from "@/components/predictions/PredictionsHistoryTable";
import { Pagination } from "@/components/common/Pagination";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";
import { EMISSION_LEVEL_OPTIONS } from "@/utils/emissionLevel";

export default function Predictions() {
    const { farmId } = useFarmContext();
    const [level, setLevel] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const filters = {
        farmId: farmId as number,
        level: (level || undefined) as "Low" | "Moderate" | "High" | undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
    };

    // predictionsResult is the paged response from the backend:
    // { items, totalCount, page, pageSize } — not a raw array
    const { data: predictionsResult, isLoading, isError, error } = usePredictionHistory(filters);
    // Client-side Cattle ID filter, applied only within the current
    // page's items — see file header for why this can't be a real
    // server-side search param yet
    const visiblePredictions = useMemo(() => {
        if (!predictionsResult) return undefined;
        if (!search.trim()) return predictionsResult.items;
        return predictionsResult.items.filter((p) => String(p.cattleId).includes(search.trim()));
    }, [predictionsResult, search]);

    // Reset to page 1 whenever the level filter changes
    function handleLevelChange(value: string) {
        setLevel(value);
        setPage(1);
    }

    // Reset to page 1 whenever the date range changes
    function handleDateFromChange(value: string) {
        setDateFrom(value);
        setPage(1);
    }

    function handleDateToChange(value: string) {
        setDateTo(value);
        setPage(1);
    }

    // Trigger the CSV download, showing a brief loading state on the button
    async function handleExport() {
        setIsExporting(true);
        setExportError(null);
        try {
            await downloadPredictionHistoryCsv({
                farmId: filters.farmId,
                level: filters.level,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
            });
        } catch (err) {
            setExportError(getFriendlyErrorMessage(err, "Could not export the CSV. Please try again."));
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-semibold text-on-surface">Predictions</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        Full history of every methane prediction across your farm.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => handleDateFromChange(e.target.value)}
                        aria-label="From date"
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => handleDateToChange(e.target.value)}
                        aria-label="To date"
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />

                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || !predictionsResult?.items.length}
                        className="flex items-center gap-1.5 rounded-md border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export CSV"}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by Cattle ID..."
                    className="sm:max-w-xs"
                />
                <FilterDropdown
                    value={level}
                    onChange={handleLevelChange}
                    options={EMISSION_LEVEL_OPTIONS}
                    placeholder="All emission levels"
                    className="sm:w-56"
                />
            </div>

            {exportError && (
                <p className="text-sm text-error" role="alert">
                    {exportError}
                </p>
            )}

            {isLoading && (
                <p className="text-sm text-on-surface-variant">Loading predictions...</p>
            )}

            {isError && (
                <p className="text-sm text-error" role="alert">
                    {getFriendlyErrorMessage(error, "Could not load prediction history. Please try again shortly.")}
                </p>
            )}

            {visiblePredictions && predictionsResult && (
                <>
                    <PredictionsHistoryTable predictions={visiblePredictions} />
                    <Pagination
                        currentPage={predictionsResult.page}
                        totalPages={Math.max(
                            1,
                            Math.ceil(predictionsResult.totalCount / predictionsResult.pageSize)
                        )}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
}