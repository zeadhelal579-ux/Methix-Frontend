// ============================================================
// File: src/types/farm.ts
// Purpose: Type definitions for farm data and team management
// Logic:
//   - Mirrors FarmController DTOs (Settings page: metadata +
//     personnel list)
//   - No coordinates: the backend's FortyGuard weather
//     integration (which was the only consumer of a farm's
//     Latitude/Longitude) has been removed entirely, and the
//     Farm entity/DTOs no longer carry those fields
// ============================================================
import type { Role } from "./user";

// Core farm entity, matching the Farm table in SQL Architecture
export interface Farm {
    farmId: number;
    name: string;
    operationalStatus: string; // e.g. "Active - Monitoring"
}

// Payload for PUT /api/farms/{farmId} (Settings > Core Metadata)
export interface UpdateFarmDto {
    name: string;
}

// Payload for POST /api/farms — used once, right after register/login,
// by a user who does not belong to a farm yet (see CreateFarm.tsx)
export interface CreateFarmDto {
    name: string;
}

// Response for POST /api/farms.
// BUG FIX: the backend promotes the farm's creator to "Admin" in the
// database, but their existing token (from Login/Register) still
// carries the old "Farmer" role claim until reissued — JWTs don't
// update themselves. The backend now returns a fresh token reflecting
// the new role; CreateFarm.tsx stores it via AuthContext.login() so an
// immediate "Add team member" (Admin-only) doesn't 403 out of nowhere.
export interface CreateFarmResponse extends Farm {
    token: string;
}

// A single team member row (Settings > Personnel Access)
export interface Personnel {
    userId: number;
    name: string;
    email: string;
    role: Role;
}

// Payload for POST /api/farms/{farmId}/personnel
export interface AddPersonnelDto {
    name: string;
    email: string;
    password: string;
    role: Role;
}