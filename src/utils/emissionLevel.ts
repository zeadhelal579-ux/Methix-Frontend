// ============================================================
// File: src/utils/emissionLevel.ts
// Purpose: Single source of truth for everything related to the
//          Low / Moderate / High emission classification
// Logic:
//   - Maps each EmissionLevel to its Tailwind color tokens
//     (defined in index.css from DESIGN.md) and its display label
//   - Used by StatusBadge.tsx everywhere a classification is shown
//     (Dashboard, Cattle List, Cattle Detail, Predictions) so any
//     future color/label change happens in exactly one place
//   - Does NOT classify raw methane amounts itself anymore: the AI
//     model now returns emissionLevel directly (already classified
//     using its own dynamic, data-driven thresholds), so a hardcoded
//     200/400 g/day cutoff here would be wrong and redundant
//   - getEmissionLevelConfig() always returns a usable config, even
//     for a level string outside "Low"/"Moderate"/"High": the backend
//     writes PredictionHistory.EmissionLevel directly from the
//     external AI microservice's free-text "risk_level" JSON field
//     with no server-side whitelist, so an unexpected value reaching
//     the browser is a real possibility, not just a type-level
//     formality — and with no global Error Boundary in this app,
//     letting StatusBadge destructure `undefined` here would blank
//     the entire page (Dashboard/CattleList/CattleDetail/Predictions
//     all render it)
// ============================================================
import type { EmissionLevel } from "@/types/cattle";

// Visual config for one emission level: soft-tint badge per DESIGN.md
// ("Status Badges: soft-tint background + high-contrast text, same hue")
interface EmissionLevelConfig {
    label: string;
    textClass: string;
    bgClass: string;
}

const EMISSION_LEVEL_MAP: Record<EmissionLevel, EmissionLevelConfig> = {
    Low: {
        label: "Low",
        textClass: "text-emission-low",
        bgClass: "bg-emission-low/10",
    },
    Moderate: {
        label: "Moderate",
        textClass: "text-emission-moderate",
        bgClass: "bg-emission-moderate/10",
    },
    High: {
        label: "High",
        textClass: "text-emission-high",
        bgClass: "bg-emission-high/10",
    },
};

// Neutral fallback used only when a value outside Low/Moderate/High
// reaches the browser (see file header) — keeps the UI legible
// instead of crashing
const UNKNOWN_LEVEL_CONFIG: EmissionLevelConfig = {
    label: "Unknown",
    textClass: "text-on-surface-variant",
    bgClass: "bg-surface-container-high",
};

// Get the badge label + color classes for a given emission level.
// Never throws / returns undefined, even for a value the type system
// didn't expect — see file header for why that matters here.
export function getEmissionLevelConfig(level: EmissionLevel): EmissionLevelConfig {
    return EMISSION_LEVEL_MAP[level] ?? UNKNOWN_LEVEL_CONFIG;
}

// Shared Low/Moderate/High filter options — single source of truth for
// the dropdown used on both CattleList.tsx and Predictions.tsx (was
// previously duplicated verbatim in each file)
export const EMISSION_LEVEL_OPTIONS: { value: EmissionLevel; label: string }[] = [
    { value: "Low", label: "Low" },
    { value: "Moderate", label: "Moderate" },
    { value: "High", label: "High" },
];