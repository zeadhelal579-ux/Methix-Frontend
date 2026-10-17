// ============================================================
// File: src/types/cattle.ts
// Purpose: Type definitions for cattle and feed record data
// Logic:
//   - Mirrors CattleController + FeedRecordController DTOs
//   - "EmissionLevel" is shared across the app (cattle list,
//     dashboard, predictions) to keep the Low/Moderate/High
//     classification consistent everywhere, per StatusBadge rule
//     in Frontend Architecture
// ============================================================

// Shared emission classification, used by StatusBadge everywhere
export type EmissionLevel = "Low" | "Moderate" | "High";

// Animal sex, required by the AI model as "Sex" (1=Male, 2=Female)
export type CattleSex = 1 | 2;

// Metabolic status, required by the AI model as "Metabolic_Status"
// Replaces the old free-text "lactationStage" field
export type MetabolicStatus = "Lactating" | "Growing" | "Dry";

// Row shape for the Cattle Inventory table (GET /api/cattle)
export interface CattleListItem {
    cattleId: number;
    breed: string;
    age: number;
    weight: number;
    sex: CattleSex;
    metabolicStatus: MetabolicStatus;
    latestEmissionLevel: EmissionLevel | null;
}

// Full detail shape for the Cattle Detail page (GET /api/cattle/{id})
export interface CattleDetail {
    cattleId: number;
    farmId: number;
    breed: string;
    age: number;
    weight: number;
    sex: CattleSex;
    dim: number; // Days In Milk — AI model field "DIM"
    milkKgDay: number; // Milk yield (kg/day) — AI model field "Milk_kg_day"
    milkFatPct: number; // Milk fat % — AI model field "Milk_Fat_pct"
    milkLactosePct: number; // Milk lactose % — AI model field "Milk_Lactose_pct"
    metabolicStatus: MetabolicStatus;
}

// Payload for POST /api/cattle (Add cattle)
export interface CreateCattleDto {
    farmId: number;
    breed: string;
    age: number;
    weight: number;
    sex: CattleSex;
    dim: number;
    milkKgDay: number;
    milkFatPct: number;
    milkLactosePct: number;
    metabolicStatus: MetabolicStatus;
}
// Payload for PUT /api/cattle/{cattleId} (Edit cattle)
export interface UpdateCattleDto {
    breed: string;
    age: number;
    weight: number;
    sex: CattleSex;
    dim: number;
    milkKgDay: number;
    milkFatPct: number;
    milkLactosePct: number;
    metabolicStatus: MetabolicStatus;
}

// A single feed record row (FeedRecordTable)
export interface FeedRecord {
    feedId: number;
    date: string;
    foragePctDM: number; // AI model field "Forage_pct_DM"
    ndfPctDM: number; // AI model field "NDF_pct_DM"
    adfPctDM: number; // AI model field "ADF_pct_DM"
    starchPctDM: number; // AI model field "Starch_pct_DM"
    fatPercentage: number; // AI model field "EE_pct_DM"
    proteinPercentage: number; // AI model field "CP_pct_DM"
    temperature: number; // Temp °C — displayed after Protein % per confirmed design
    dmi: number; // AI model field "DMI_kg_day"
}

// Payload for POST /api/cattle/{cattleId}/feed-records
export interface CreateFeedRecordDto {
    foragePctDM: number;
    ndfPctDM: number;
    adfPctDM: number;
    starchPctDM: number;
    fatPercentage: number;
    proteinPercentage: number;
    temperature: number;
    dmi: number;
}