// ============================================================
// File: src/components/common/StatusBadge.tsx
// Purpose: Single, reusable pill badge for Low/Moderate/High
//          emission classification, used across the whole app
// Logic:
//   - Pulls its label + color classes from utils/emissionLevel.ts,
//     the app's single source of truth for this classification
//   - Fully rounded (pill) shape per DESIGN.md's shape language
//     for badges, sentence case text only (no all-caps)
// ============================================================
import { getEmissionLevelConfig } from "@/utils/emissionLevel";
import type { EmissionLevel } from "@/types/cattle";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    level: EmissionLevel;
    className?: string;
}

// Renders a soft-tint, pill-shaped badge for a given emission level
export function StatusBadge({ level, className }: StatusBadgeProps) {
    const config = getEmissionLevelConfig(level);

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                config.bgClass,
                config.textClass,
                className
            )}
        >
            {config.label}
        </span>
    );
}