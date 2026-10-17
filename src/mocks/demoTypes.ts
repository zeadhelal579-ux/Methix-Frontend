// ============================================================
// File: src/mocks/demoTypes.ts
// Purpose: Shared type definitions for the in-browser demo database
// Logic:
//   - Every record extends the exact shape the real API returns
//     (types/*.ts), plus the few extra fields a real database would
//     keep server-side (owner ids, passwords, foreign keys)
//   - The whole DemoDb object is serialized into localStorage, so
//     it must stay plain JSON data (no classes, no Dates)
// ============================================================
import type { CattleDetail, EmissionLevel, FeedRecord } from "@/types/cattle";
import type { Farm } from "@/types/farm";
import type { Role } from "@/types/user";

// A registered account. password is null for Google-only accounts
export interface DemoUser {
    userId: number;
    name: string;
    email: string;
    password: string | null;
    role: Role;
    farmId: number | null;
    picture?: string;
}

// A farm plus the id of the user that created it
export interface DemoFarm extends Farm {
    ownerUserId: number;
}

// A feed record plus the animal it belongs to
export interface DemoFeedRecord extends FeedRecord {
    cattleId: number;
}

// One stored prediction (the history table row shape)
export interface DemoPrediction {
    predictionId: number;
    cattleId: number;
    cattleBreed: string;
    date: string;
    predictedMethaneAmount: number;
    emissionLevel: EmissionLevel;
}

// Auto-increment counters, one per table
export interface DemoCounters {
    user: number;
    farm: number;
    cattle: number;
    feed: number;
    prediction: number;
}

// The complete demo database persisted in localStorage
export interface DemoDb {
    counters: DemoCounters;
    users: DemoUser[];
    farms: DemoFarm[];
    cattle: CattleDetail[];
    feedRecords: DemoFeedRecord[];
    predictions: DemoPrediction[];
}
