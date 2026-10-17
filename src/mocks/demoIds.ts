// ============================================================
// File: src/mocks/demoIds.ts
// Purpose: Auto-increment id generator for the demo database tables
// Logic:
//   - Mimics a SQL identity column: every table has its own counter
//     stored inside the database object, so ids stay unique and keep
//     growing across page reloads (the counters are persisted too)
// ============================================================
import type { DemoCounters, DemoDb } from "./demoTypes";

// Returns the next id for the given table and advances its counter
export function nextId(db: DemoDb, table: keyof DemoCounters): number {
    db.counters[table] += 1;
    return db.counters[table];
}
