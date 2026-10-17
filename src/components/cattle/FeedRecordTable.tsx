// ============================================================
// File: src/components/cattle/FeedRecordTable.tsx
// Purpose: Table listing an animal's feed record history
//          (Cattle Detail page)
// Logic:
//   - Purely presentational: receives records from
//     useFeedRecords(cattleId), no fetching logic here
//   - All nutritional percentages use tabular figures so columns
//     align, per DESIGN.md typography spec
//   - Column order: Date, Intake (kg), Forage %, NDF %, ADF %,
//     Starch %, Fat %, Protein %, Temp (°C) — replaces the old
//     single generic "Fiber %" column with the 4 detailed feed
//     composition fields the AI model actually requires
//   - Wrapped in overflow-x-auto since 9 columns no longer fit
//     comfortably on narrow screens
// ============================================================
import type { FeedRecord } from "@/types/cattle";
import { formatDate, formatNumber } from "@/utils/formatters";

interface FeedRecordTableProps {
    records: FeedRecord[];
}

// Renders the full feed record history for one animal
export function FeedRecordTable({ records }: FeedRecordTableProps) {
    // Empty state: guides the user to add the first record instead of
    // showing a blank table, per frontend-design's empty-state principle
    if (records.length === 0) {
        return (
            <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-8 text-center">
                <p className="text-sm text-on-surface-variant">
                    No feed records yet. Add one to start tracking this animal's diet.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-md border border-outline-variant bg-surface-container-lowest">
            <table className="w-full text-sm">
                {/* Table header: label-md styling in neutral color, per
                    DESIGN.md's Data Tables spec */}
                <thead>
                    <tr className="border-b border-outline-variant text-left">
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">Date</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Intake (kg)
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Forage %
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">NDF %</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">ADF %</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Starch %
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">Fat %</th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Protein %
                        </th>
                        <th className="px-4 py-3 text-xs font-medium text-on-surface-variant">
                            Temp (°C)
                        </th>
                    </tr>
                </thead>

                {/* Table body: one row per feed record, all numeric
                    columns use tabular-nums for aligned digits */}
                <tbody className="divide-y divide-outline-variant">
                    {records.map((record) => (
                        <tr key={record.feedId}>
                            <td className="px-4 py-3 text-on-surface-variant">
                                {formatDate(record.date)}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.dmi)}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.foragePctDM)}%
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.ndfPctDM)}%
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.adfPctDM)}%
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.starchPctDM)}%
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.fatPercentage)}%
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.proteinPercentage)}%
                            </td>
                            <td className="px-4 py-3 tabular-nums text-on-surface">
                                {formatNumber(record.temperature)}°C
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}