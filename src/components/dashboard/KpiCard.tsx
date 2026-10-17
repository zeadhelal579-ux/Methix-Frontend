// ============================================================
// File: src/components/dashboard/KpiCard.tsx
// Purpose: Reusable single-number KPI card (Total cattle, Avg
//          methane, High risk cattle)
// Logic:
//   - Pure presentational component: receives a label, value,
//     and icon, renders them in a consistent card shape
//   - "variant" defaults to "neutral" (every KPI card); "danger"
//     is used only for the High risk cattle card, per the
//     Dashboard mockup's distinct red-tinted highlight — reuses
//     the same error/error-container tokens already used by
//     Settings > Danger Zone, so the "this needs attention" color
//     stays consistent across the whole app
//   - "trend" is optional — only KPIs that make sense to compare
//     against a previous period (e.g. avg methane) pass it
// ============================================================
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    label: string;
    value: string;
    icon: LucideIcon;
    variant?: "neutral" | "danger";
    trend?: {
        direction: "up" | "down";
        value: string;
    };
    className?: string;
}

// Renders one KPI metric as a bordered, 12px-radius card (DESIGN.md shapes)
export function KpiCard({
    label,
    value,
    icon: Icon,
    variant = "neutral",
    trend,
    className,
}: KpiCardProps) {
    const isDanger = variant === "danger";

    return (
        <div
            className={cn(
                "rounded-md border p-5",
                isDanger
                    ? "border-error/30 bg-error-container/10"
                    : "border-outline-variant bg-surface-container-lowest",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface-variant">{label}</span>
                <Icon className={cn("h-5 w-5", isDanger ? "text-error" : "text-primary")} strokeWidth={2} />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
                <span
                    className={cn(
                        "font-display text-2xl font-semibold tabular-nums",
                        isDanger ? "text-error" : "text-on-surface"
                    )}
                >
                    {value}
                </span>
                {trend && (
                    <span
                        className={cn(
                            "text-xs font-medium",
                            trend.direction === "up" ? "text-emission-high" : "text-emission-low"
                        )}
                    >
                        {trend.direction === "up" ? "↑" : "↓"} {trend.value}
                    </span>
                )}
            </div>
        </div>
    );
}