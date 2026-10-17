// ============================================================
// File: src/components/common/SearchBar.tsx
// Purpose: Reusable search input, integrated into table headers
//          (Cattle Inventory, Predictions History, etc.)
// Logic:
//   - Controlled input: parent owns the value/onChange, this
//     component only renders the UI (icon + input + focus ring)
//   - Debouncing (if needed) is the parent's responsibility via
//     the hook's queryKey, not baked in here, to keep this
//     component simple and predictable
// ============================================================
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

// Search input with a leading icon, styled per DESIGN.md input tokens
export function SearchBar({ value, onChange, placeholder = "Search", className }: SearchBarProps) {
    return (
        <div className={cn("relative", className)}>
            <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                aria-hidden="true"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "h-10 w-full rounded-md border border-outline-variant bg-surface-container-lowest",
                    "pl-9 pr-3 text-sm text-on-surface placeholder:text-outline",
                    "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                )}
            />
        </div>
    );
}