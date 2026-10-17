// ============================================================
// File: src/components/common/Pagination.tsx
// Purpose: Reusable pagination controls for any table
//          (Cattle Inventory, Predictions History)
// Logic:
//   - Fully controlled: parent owns currentPage and passes total
//     page count + a callback; no internal page state here
//   - Buttons disable themselves at the first/last page instead
//     of the parent needing to compute that
// ============================================================
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

// Simple prev/next pagination bar with a "Page X of Y" label
export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    return (
        <div className={cn("flex items-center justify-between", className)}>
            <span className="text-sm text-on-surface-variant">
                Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={isFirstPage}
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant",
                        "text-on-surface disabled:cursor-not-allowed disabled:opacity-40",
                        "hover:not-disabled:bg-surface-container"
                    )}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={isLastPage}
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant",
                        "text-on-surface disabled:cursor-not-allowed disabled:opacity-40",
                        "hover:not-disabled:bg-surface-container"
                    )}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}