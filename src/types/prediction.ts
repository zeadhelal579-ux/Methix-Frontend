// ============================================================
// File: src/types/prediction.ts
// Purpose: Type definitions for prediction results, SHAP
//          explanation data, and recommendations
// Logic:
//   - Mirrors PredictionController DTOs and the AI Service
//     response contract (POST /predict) documented in
//     AI-Architecture.txt
// ============================================================
import type { EmissionLevel } from "./cattle";

// A single SHAP factor: how much one feature pushed the result
// Positive shapValue = increased methane, negative = decreased it
// "direction" is used for coloring instead of relying on the sign alone
export interface TopContributor {
    feature: string;
    shapValue: number;
    direction: "increases" | "decreases";
}

// A single actionable recommendation with its urgency level
export interface RecommendationItem {
    priority: "HIGH" | "MEDIUM" | "LOW" | "INFO";
    recommendation: string;
}

// Dynamic Low/High cutoffs computed by the AI model from training data
// distribution (replaces the old hardcoded 200/400 thresholds)
export interface RiskThresholds {
    low: number;
    high: number;
}

// Full result returned right after POST /api/cattle/{cattleId}/predict
export interface PredictionResult {
    predictionId: number;
    cattleId: number;
    date: string;
    predictedMethaneAmount: number;
    emissionLevel: EmissionLevel;
    topContributors: TopContributor[];
    recommendations: RecommendationItem[];
    riskThresholds: RiskThresholds;
    modelVersion: string;
}

// Row shape for the Predictions History table (GET /api/predictions)
export interface PredictionHistoryItem {
    predictionId: number;
    cattleId: number;
    cattleBreed: string;
    date: string;
    predictedMethaneAmount: number;
    emissionLevel: EmissionLevel;
}

// Query filters for GET /api/predictions
export interface PredictionHistoryFilters {
    farmId: number;
    dateFrom?: string;
    dateTo?: string;
    level?: EmissionLevel;
    page?: number;
}