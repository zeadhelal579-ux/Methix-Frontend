// ============================================================
// File: src/mocks/demoDb.ts
// Purpose: Persistence layer of the in-browser demo backend
// Logic:
//   - Keeps the whole demo database in one localStorage entry so data
//     the visitor adds (cattle, feed records, predictions, accounts)
//     survives page reloads, exactly like a real backend would
//   - Reads lazily and caches in memory; every mutating request saves
//     once after it succeeds (see demoAdapter.ts)
//   - Any unreadable or outdated stored value is discarded and replaced
//     by a fresh seeded database, so a corrupted entry can never break
//     the app
//   - The key carries a version suffix: bump it whenever the DemoDb
//     shape changes so old browsers regenerate cleanly
// ============================================================
import { createSeededDb } from "./demoSeed";
import type { DemoDb } from "./demoTypes";

const DB_KEY = "methix_demo_db_v1";

// In-memory copy so repeated requests do not re-parse localStorage
let cachedDb: DemoDb | null = null;

// Checks that a parsed value has the structure the adapter relies on
function isValidDb(value: unknown): value is DemoDb {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Partial<DemoDb>;
    return (
        typeof candidate.counters === "object" &&
        candidate.counters !== null &&
        Array.isArray(candidate.users) &&
        Array.isArray(candidate.farms) &&
        Array.isArray(candidate.cattle) &&
        Array.isArray(candidate.feedRecords) &&
        Array.isArray(candidate.predictions)
    );
}

// Writes the database to localStorage; silently keeps working in
// memory if storage is full or blocked (private mode, quota)
export function saveDb(db: DemoDb): void {
    cachedDb = db;
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
        // In-memory copy still serves this session
    }
}

// Returns the demo database, creating and saving a seeded one if needed
export function getDb(): DemoDb {
    if (cachedDb) return cachedDb;

    try {
        const stored = localStorage.getItem(DB_KEY);
        if (stored) {
            const parsed: unknown = JSON.parse(stored);
            if (isValidDb(parsed)) {
                cachedDb = parsed;
                return parsed;
            }
        }
    } catch {
        // Corrupted entry: fall through and rebuild below
    }

    const fresh = createSeededDb();
    saveDb(fresh);
    return fresh;
}

// Wipes all demo data (the next request regenerates the sample data)
export function resetDemoDb(): void {
    cachedDb = null;
    try {
        localStorage.removeItem(DB_KEY);
    } catch {
        // Nothing to clean if storage is unavailable
    }
}
