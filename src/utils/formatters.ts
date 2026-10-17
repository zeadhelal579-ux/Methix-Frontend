// ============================================================
// File: src/utils/formatters.ts
// Purpose: Shared formatting functions for dates and numbers
// Logic:
//   - Centralizes all display formatting so tables/cards across
//     the app stay visually consistent (date format, decimals,
//     tabular number alignment)
//   - Every function guards against null/undefined input and
//     returns a safe placeholder ("—") instead of throwing,
//     since a missing/mismatched backend field should degrade
//     to a visible placeholder, not crash the whole page
//   - Date-only strings ("2026-09-12", what a .NET DateOnly serializes
//     to) are parsed as LOCAL dates. new Date("2026-09-12") alone is
//     parsed as UTC midnight, which shows the previous day for anyone
//     west of UTC
//   - formatSex is the single source of truth for the AI model's
//     numeric Sex code (1=Male, 2=Female); previously duplicated
//     identically in CattleProfileCard.tsx and CattleTable.tsx
// ============================================================
import type { CattleSex } from "@/types/cattle";

const PLACEHOLDER = "—";

// Parses an API date. A date-only string becomes local midnight; anything
// else (full ISO timestamps) goes through the normal Date parser
function parseApiDate(isoDate: string): Date {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (dateOnly) {
        return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    }
    return new Date(isoDate);
}

// Format an ISO date string into a short, readable date (e.g. "Aug 16, 2026")
export function formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return PLACEHOLDER;
    const date = parseApiDate(isoDate);
    if (Number.isNaN(date.getTime())) return PLACEHOLDER;
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// Format an ISO date string into date + time (e.g. "Aug 16, 2026, 3:45 PM")
export function formatDateTime(isoDate: string | null | undefined): string {
    if (!isoDate) return PLACEHOLDER;
    const date = parseApiDate(isoDate);
    if (Number.isNaN(date.getTime())) return PLACEHOLDER;
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

// Format a methane amount in grams with a fixed unit suffix (e.g. "342.5 g/day")
export function formatMethaneAmount(amountGrams: number | null | undefined): string {
    if (amountGrams == null || Number.isNaN(amountGrams)) return PLACEHOLDER;
    return `${amountGrams.toFixed(1)} g/day`;
}

// Format a plain number with a fixed number of decimals (e.g. weight, DMI, %)
export function formatNumber(value: number | null | undefined, decimals = 1): string {
    if (value == null || Number.isNaN(value)) return PLACEHOLDER;
    return value.toFixed(decimals);
}

// Maps the AI model's numeric Sex code (1/2) to a readable label —
// used by CattleProfileCard and CattleTable
export function formatSex(sex: CattleSex): string {
    return sex === 1 ? "Male" : "Female";
}