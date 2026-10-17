// ============================================================
// File: src/mocks/demoSeed.ts
// Purpose: Builds the sample data shown in the backend-free demo
// Logic:
//   - createSeededDb(): a brand-new database containing the demo
//     account (see DEMO_EMAIL), its farm, two team members, a herd,
//     feed records and 30 days of prediction history
//   - createFarmWithSampleData(): used again whenever a NEW user
//     creates their first farm in demo mode, so a fresh account lands
//     on a populated dashboard instead of an empty one
//   - A seeded pseudo-random generator keeps the sample data
//     deterministic per farm (same numbers on every fresh start)
//   - History is produced by the same simulated model used for live
//     predictions, so list badges, charts and detail pages agree
//   - Each animal has a feed "profile" (efficient / average / high
//     emitter) that shapes its sample ration, so the herd shows a
//     realistic mix of Low, Moderate and High results
//   - History timestamps are always in the past (never later today than
//     "now"), so a prediction run live is always the newest row
// ============================================================
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/config/env";
import type { CattleDetail, CattleSex, MetabolicStatus } from "@/types/cattle";
import { nextId } from "./demoIds";
import { classifyAmount, runDemoModel } from "./demoPrediction";
import type { DemoDb, DemoFarm, DemoFeedRecord, DemoPrediction, DemoUser } from "./demoTypes";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// How an animal's sample ration tends to affect methane
type FeedProfile = "efficient" | "average" | "high";

// Static profile of one sample animal
interface SeedAnimal {
    breed: string;
    age: number;
    weight: number;
    sex: CattleSex;
    dim: number;
    milkKgDay: number;
    milkFatPct: number;
    milkLactosePct: number;
    metabolicStatus: MetabolicStatus;
    feedProfile: FeedProfile;
}

// The sample herd (the last two animals intentionally get no prediction
// so the "No prediction yet" state is visible in the list)
const SEED_HERD: SeedAnimal[] = [
    { breed: "Holstein Friesian", age: 48, weight: 640, sex: 2, dim: 120, milkKgDay: 32.5, milkFatPct: 3.8, milkLactosePct: 4.7, metabolicStatus: "Lactating", feedProfile: "high" },
    { breed: "Holstein Friesian", age: 36, weight: 610, sex: 2, dim: 210, milkKgDay: 27, milkFatPct: 3.9, milkLactosePct: 4.6, metabolicStatus: "Lactating", feedProfile: "average" },
    { breed: "Jersey", age: 42, weight: 430, sex: 2, dim: 95, milkKgDay: 22.4, milkFatPct: 5.1, milkLactosePct: 4.8, metabolicStatus: "Lactating", feedProfile: "efficient" },
    { breed: "Brown Swiss", age: 54, weight: 680, sex: 2, dim: 180, milkKgDay: 28.2, milkFatPct: 4, milkLactosePct: 4.7, metabolicStatus: "Lactating", feedProfile: "high" },
    { breed: "Ayrshire", age: 40, weight: 560, sex: 2, dim: 260, milkKgDay: 20.5, milkFatPct: 4.1, milkLactosePct: 4.6, metabolicStatus: "Lactating", feedProfile: "average" },
    { breed: "Montbéliarde", age: 52, weight: 600, sex: 2, dim: 150, milkKgDay: 25.8, milkFatPct: 3.7, milkLactosePct: 4.7, metabolicStatus: "Lactating", feedProfile: "average" },
    { breed: "Jersey", age: 38, weight: 420, sex: 2, dim: 70, milkKgDay: 21, milkFatPct: 5.3, milkLactosePct: 4.9, metabolicStatus: "Lactating", feedProfile: "efficient" },
    { breed: "Guernsey", age: 18, weight: 380, sex: 2, dim: 0, milkKgDay: 0, milkFatPct: 0, milkLactosePct: 0, metabolicStatus: "Growing", feedProfile: "average" },
    { breed: "Simmental", age: 30, weight: 520, sex: 2, dim: 0, milkKgDay: 0, milkFatPct: 0, milkLactosePct: 0, metabolicStatus: "Growing", feedProfile: "average" },
    { breed: "Normande", age: 72, weight: 650, sex: 2, dim: 0, milkKgDay: 0, milkFatPct: 0, milkLactosePct: 0, metabolicStatus: "Dry", feedProfile: "average" },
    { breed: "Holstein Friesian", age: 14, weight: 330, sex: 1, dim: 0, milkKgDay: 0, milkFatPct: 0, milkLactosePct: 0, metabolicStatus: "Growing", feedProfile: "average" },
    { breed: "Brown Swiss", age: 46, weight: 660, sex: 2, dim: 200, milkKgDay: 26.1, milkFatPct: 4.2, milkLactosePct: 4.7, metabolicStatus: "Lactating", feedProfile: "average" },
];

type ValueRange = readonly [number, number];

// Sample ration ranges per profile (percent of dry matter, degrees, kg)
const PROFILE_RANGES: Record<
    FeedProfile,
    {
        forage: ValueRange;
        ndf: ValueRange;
        adf: ValueRange;
        starch: ValueRange;
        fat: ValueRange;
        protein: ValueRange;
        temp: ValueRange;
        dmiBoost: number;
    }
> = {
    efficient: { forage: [46, 52], ndf: [28, 31], adf: [17, 19], starch: [27, 30], fat: [4.6, 5.4], protein: [14, 16], temp: [18, 22], dmiBoost: -2 },
    average: { forage: [50, 60], ndf: [31, 36], adf: [19, 22], starch: [23, 27], fat: [3.3, 4.2], protein: [15, 17], temp: [20, 26], dmiBoost: 0 },
    high: { forage: [60, 65], ndf: [37, 40], adf: [22, 25], starch: [20, 23], fat: [2.6, 3.2], protein: [16, 18], temp: [26, 32], dmiBoost: 3 },
};

// How many of the last animals get no prediction history
const ANIMALS_WITHOUT_PREDICTIONS = 2;

// Deterministic pseudo-random number generator (mulberry32), returns [0, 1)
function createRng(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Random number in [min, max] rounded to one decimal place
function between(rng: () => number, min: number, max: number): number {
    return Math.round((min + rng() * (max - min)) * 10) / 10;
}

// ISO timestamp for "N days ago" at a given hour (UTC), used for feed records
function daysAgoIso(days: number, hour: number): string {
    const date = new Date(Date.now() - days * DAY_MS);
    date.setUTCHours(hour, 0, 0, 0);
    return date.toISOString();
}

// ISO timestamp somewhere between 06:00 and 18:00 UTC of the calendar day
// "N days ago". Staying inside one UTC day keeps the daily trend free of
// gaps, and for today the time is capped at "now" so it is never in the future
function pastIso(days: number, rng: () => number): string {
    const now = Date.now();
    const dayStart = new Date(now - days * DAY_MS);
    dayStart.setUTCHours(0, 0, 0, 0);
    const endOfDay = dayStart.getTime() + DAY_MS - 1;
    const limit = days === 0 ? Math.min(now, endOfDay) : endOfDay;
    const earliest = Math.min(dayStart.getTime() + 6 * HOUR_MS, limit);
    const latest = Math.min(dayStart.getTime() + 18 * HOUR_MS, limit);
    return new Date(earliest + Math.floor(rng() * (latest - earliest + 1))).toISOString();
}

// Creates one plausible feed record for an animal
function buildFeedRecord(
    db: DemoDb,
    rng: () => number,
    cattleId: number,
    animal: SeedAnimal,
    daysAgo: number
): DemoFeedRecord {
    const isLactating = animal.metabolicStatus === "Lactating";
    const isDry = animal.metabolicStatus === "Dry";
    const ranges = PROFILE_RANGES[animal.feedProfile];
    return {
        feedId: nextId(db, "feed"),
        cattleId,
        date: daysAgoIso(daysAgo, 8),
        dmi: isLactating
            ? between(rng, 20 + ranges.dmiBoost, 23 + ranges.dmiBoost)
            : isDry
              ? between(rng, 12, 15)
              : between(rng, 8, 12),
        foragePctDM: between(rng, ...ranges.forage),
        ndfPctDM: between(rng, ...ranges.ndf),
        adfPctDM: between(rng, ...ranges.adf),
        starchPctDM: between(rng, ...ranges.starch),
        fatPercentage: between(rng, ...ranges.fat),
        proteinPercentage: between(rng, ...ranges.protein),
        temperature: between(rng, ...ranges.temp),
    };
}

// Fills a farm with the sample herd, feed records and prediction history
function populateFarm(db: DemoDb, farmId: number): void {
    const rng = createRng(1000 + farmId);
    const animals: CattleDetail[] = [];

    SEED_HERD.forEach((animal) => {
        const cattle: CattleDetail = {
            cattleId: nextId(db, "cattle"),
            farmId,
            breed: animal.breed,
            age: animal.age,
            weight: animal.weight,
            sex: animal.sex,
            dim: animal.dim,
            milkKgDay: animal.milkKgDay,
            milkFatPct: animal.milkFatPct,
            milkLactosePct: animal.milkLactosePct,
            metabolicStatus: animal.metabolicStatus,
        };
        animals.push(cattle);
        db.cattle.push(cattle);
        db.feedRecords.push(buildFeedRecord(db, rng, cattle.cattleId, animal, 21));
        db.feedRecords.push(buildFeedRecord(db, rng, cattle.cattleId, animal, 5));
    });

    // 30 days of history: 1-3 predictions per day on random animals
    const pool = animals.slice(0, animals.length - ANIMALS_WITHOUT_PREDICTIONS);
    const history: Omit<DemoPrediction, "predictionId">[] = [];

    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
        const perDay = 1 + (rng() < 0.65 ? 1 : 0) + (rng() < 0.25 ? 1 : 0);
        for (let i = 0; i < perDay; i++) {
            const cattle = pool[Math.floor(rng() * pool.length)];
            const records = db.feedRecords
                .filter((record) => record.cattleId === cattle.cattleId)
                .sort((a, b) => a.date.localeCompare(b.date));
            const base = records[records.length - 1];
            const jittered = {
                ...base,
                dmi: Math.round(base.dmi * (0.94 + rng() * 0.12) * 10) / 10,
                temperature: Math.round((base.temperature + (rng() * 6 - 3)) * 10) / 10,
            };
            const output = runDemoModel(cattle, jittered);
            history.push({
                cattleId: cattle.cattleId,
                cattleBreed: cattle.breed,
                date: pastIso(daysAgo, rng),
                predictedMethaneAmount: output.amount,
                emissionLevel: classifyAmount(output.amount),
            });
        }
    }

    history
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((entry) => {
            db.predictions.push({ predictionId: nextId(db, "prediction"), ...entry });
        });
}

// Creates a farm for the given owner (promoting them to Admin, like the
// real backend does) and fills it with the sample data
export function createFarmWithSampleData(db: DemoDb, owner: DemoUser, name: string): DemoFarm {
    const farm: DemoFarm = {
        farmId: nextId(db, "farm"),
        name,
        operationalStatus: "Active - Monitoring",
        ownerUserId: owner.userId,
    };
    db.farms.push(farm);
    owner.farmId = farm.farmId;
    owner.role = "Admin";
    populateFarm(db, farm.farmId);
    return farm;
}

// Builds a fresh database containing the demo account and its farm
export function createSeededDb(): DemoDb {
    const db: DemoDb = {
        counters: { user: 0, farm: 0, cattle: 0, feed: 0, prediction: 0 },
        users: [],
        farms: [],
        cattle: [],
        feedRecords: [],
        predictions: [],
    };

    const owner: DemoUser = {
        userId: nextId(db, "user"),
        name: "Demo Farmer",
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        role: "Admin",
        farmId: null,
    };
    db.users.push(owner);

    const farm = createFarmWithSampleData(db, owner, "Green Valley Dairy");

    db.users.push(
        {
            userId: nextId(db, "user"),
            name: "Amira Hassan",
            email: "amira.hassan@greenvalley.example",
            password: DEMO_PASSWORD,
            role: "Farmer",
            farmId: farm.farmId,
        },
        {
            userId: nextId(db, "user"),
            name: "Omar Khaled",
            email: "omar.khaled@greenvalley.example",
            password: DEMO_PASSWORD,
            role: "Admin",
            farmId: farm.farmId,
        }
    );

    return db;
}
