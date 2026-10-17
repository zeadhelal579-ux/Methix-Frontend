// ============================================================
// File: src/mocks/demoPrediction.ts
// Purpose: Tiny deterministic stand-in for the real AI service, used
//          only by the backend-free demo
// Logic:
//   - Starts from a herd-average baseline and adds one signed
//     contribution per input feature, the same way a SHAP explanation
//     decomposes a real model's output (baseline + sum of contributions)
//   - Directions follow well-known dairy nutrition effects: more dry
//     matter intake, fiber (NDF/ADF), forage, protein and heat push
//     methane up; more starch and dietary fat push it down
//   - The result is therefore responsive to the numbers a user types
//     in the feed form, so the demo feels alive, but it is NOT the
//     trained model and must never be presented as scientific output
//   - The classification uses fixed demo thresholds (low/high), the
//     same shape the real service returns as riskThresholds
// ============================================================
import type { CattleDetail, EmissionLevel, FeedRecord } from "@/types/cattle";
import type { RecommendationItem, RiskThresholds, TopContributor } from "@/types/prediction";

// Demo cutoffs (grams/day) returned to the UI as riskThresholds
export const DEMO_THRESHOLDS: RiskThresholds = { low: 300, high: 400 };

// Label shown next to the result as the model version
export const DEMO_MODEL_VERSION = "demo-1.0";

// Herd-average starting point (grams of methane per day)
const BASELINE_GRAMS = 330;

// Output of one simulated model run
export interface DemoModelOutput {
    amount: number;
    contributors: TopContributor[];
    recommendations: RecommendationItem[];
}

// Rounds to one decimal place
function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

// Keeps a value inside [min, max]
function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

// Maps a predicted amount to Low / Moderate / High using the demo cutoffs
export function classifyAmount(amount: number): EmissionLevel {
    if (amount < DEMO_THRESHOLDS.low) return "Low";
    if (amount > DEMO_THRESHOLDS.high) return "High";
    return "Moderate";
}

// Builds the prioritized advice list from the feed values and the level
function buildRecommendations(feed: FeedRecord, level: EmissionLevel): RecommendationItem[] {
    const items: RecommendationItem[] = [];

    if (level === "High") {
        items.push({
            priority: "HIGH",
            recommendation:
                "Predicted methane is above the high-risk cutoff. Review this animal's ration with your nutritionist this week.",
        });
    }
    if (feed.fatPercentage < 4) {
        items.push({
            priority: level === "High" ? "HIGH" : "MEDIUM",
            recommendation:
                "Raise dietary fat (EE) toward 4-5% of dry matter with a protected fat source; fat suppresses rumen methane production.",
        });
    }
    if (feed.ndfPctDM > 38) {
        items.push({
            priority: "MEDIUM",
            recommendation:
                "NDF is high. Replace part of the low-quality forage with higher-digestibility forage or concentrate.",
        });
    }
    if (feed.starchPctDM < 22) {
        items.push({
            priority: "LOW",
            recommendation:
                "A moderate increase in starch (without risking acidosis) shifts fermentation away from methane.",
        });
    }
    if (feed.temperature > 28) {
        items.push({
            priority: "MEDIUM",
            recommendation:
                "Heat load is elevated. Improve shade, ventilation and water access to keep intake stable.",
        });
    }
    if (level === "Low") {
        items.push({
            priority: "LOW",
            recommendation: "Emissions are low. Keep the current ration and monitor monthly.",
        });
    }
    items.push({
        priority: "INFO",
        recommendation: "Re-run the prediction after any ration change to confirm the effect.",
    });

    return items;
}

// Runs the simulated model for one animal and its latest feed record
export function runDemoModel(cattle: CattleDetail, feed: FeedRecord): DemoModelOutput {
    const raw: { feature: string; value: number }[] = [
        { feature: "Dry matter intake", value: (feed.dmi - 18) * 9 },
        { feature: "NDF % of DM", value: (feed.ndfPctDM - 32) * 3.2 },
        { feature: "ADF % of DM", value: (feed.adfPctDM - 20) * 1.6 },
        { feature: "Forage % of DM", value: (feed.foragePctDM - 55) * 1.1 },
        { feature: "Starch % of DM", value: (feed.starchPctDM - 25) * -2.4 },
        { feature: "Fat (EE) % of DM", value: (feed.fatPercentage - 3.5) * -14 },
        { feature: "Protein (CP) % of DM", value: (feed.proteinPercentage - 16) * 1.2 },
        { feature: "Temperature", value: (feed.temperature - 20) * 1.8 },
        { feature: "Milk yield", value: (cattle.milkKgDay - 25) * 0.9 },
        { feature: "Days in milk", value: (cattle.dim - 150) * 0.05 },
        {
            feature: "Metabolic status",
            value: cattle.metabolicStatus === "Dry" ? -25 : cattle.metabolicStatus === "Growing" ? -45 : 0,
        },
    ];

    const total = raw.reduce((sum, item) => sum + item.value, 0);
    const amount = round1(clamp(BASELINE_GRAMS + total, 120, 650));

    const contributors: TopContributor[] = raw
        .filter((item) => Math.abs(item.value) >= 0.5)
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 6)
        .map((item): TopContributor => ({
            feature: item.feature,
            shapValue: round1(item.value),
            direction: item.value >= 0 ? "increases" : "decreases",
        }));

    return {
        amount,
        contributors,
        recommendations: buildRecommendations(feed, classifyAmount(amount)),
    };
}
