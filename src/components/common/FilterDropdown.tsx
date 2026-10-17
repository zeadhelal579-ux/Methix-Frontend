// ============================================================
// File: src/components/common/FilterDropdown.tsx
// Purpose: Reusable single-select filter dropdown (e.g. filter
//          by emission level in Cattle Inventory / Predictions)
// Logic:
//   - A thin, styled wrapper over a native <select>: keeps full
//     keyboard/accessibility support for free instead of building
//     a custom listbox, while still matching the design tokens
//   - Controlled component, same pattern as SearchBar
// ============================================================
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
    value: string;
    label: string;
}

interface FilterDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    className?: string;
}

// Native select styled to match the app's input design tokens
export function FilterDropdown({
    value,
    onChange,
    options,
    placeholder = "All",
    className,
}: FilterDropdownProps) {
    return (
        <div className={cn("relative", className)}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "h-10 w-full appearance-none rounded-md border border-outline-variant",
                    "bg-surface-container-lowest pl-3 pr-9 text-sm text-on-surface",
                    "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                )}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
                aria-hidden="true"
            />
        </div>
    );
}