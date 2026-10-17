// ============================================================
// File: src/api/farmApi.ts
// Purpose: All farm settings and personnel-related backend calls
// Logic:
//   - Wraps FarmController endpoints (GET/PUT farm, personnel
//     list/add, archive status)
//   - Used by Settings.tsx and Topbar.tsx (farm name)
// ============================================================
import { axiosClient } from "./axiosClient";
import axios from "axios";
import type { AddPersonnelDto, CreateFarmDto, CreateFarmResponse, Farm, Personnel, UpdateFarmDto } from "@/types/farm";

// Create the current user's first farm (post-register/login bootstrap).
// Backend assigns the creating user to the new farm automatically, and
// (BUG FIX) also returns a fresh token reflecting their new Admin role —
// see CreateFarmResponse in types/farm.ts.
export async function createFarm(payload: CreateFarmDto): Promise<CreateFarmResponse> {
    const { data } = await axiosClient.post<CreateFarmResponse>("/farms", payload);
    return data;
}

// Get the farm the current user belongs to, or null if they don't
// belong to one yet (backend returns 404 with { error: "no_farm" }
// in that case — that is an expected state here, not a failure).
export async function getMyFarm(): Promise<Farm | null> {
    try {
        const { data } = await axiosClient.get<Farm>("/farms/me");
        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

// Get current farm details (Settings page + Topbar farm name)
export async function getFarm(farmId: number): Promise<Farm> {
    const { data } = await axiosClient.get<Farm>(`/farms/${farmId}`);
    return data;
}

// Update farm name (Settings > Core Metadata)
export async function updateFarm(farmId: number, payload: UpdateFarmDto): Promise<Farm> {
    const { data } = await axiosClient.put<Farm>(`/farms/${farmId}`, payload);
    return data;
}

// Get the team members list (Settings > Personnel Access)
export async function getPersonnel(farmId: number): Promise<Personnel[]> {
    const { data } = await axiosClient.get<Personnel[]>(`/farms/${farmId}/personnel`);
    return data;
}

// Add a new team member (Settings > "+" button, Admin only)
export async function addPersonnel(farmId: number, payload: AddPersonnelDto): Promise<Personnel> {
    const { data } = await axiosClient.post<Personnel>(`/farms/${farmId}/personnel`, payload);
    return data;
}

// Archive or reactivate the farm (Settings > Danger Zone)
export async function updateFarmStatus(farmId: number, operationalStatus: string): Promise<Farm> {
    const { data } = await axiosClient.put<Farm>(`/farms/${farmId}/status`, { operationalStatus });
    return data;
}