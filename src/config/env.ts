// ============================================================
// File: src/config/env.ts
// Purpose: Single place that reads and normalizes every build-time
//          environment variable the app depends on
// Logic:
//   - DEMO_MODE decides whether API calls go to the real backend or
//     to the in-browser mock backend (src/mocks). Explicit
//     VITE_DEMO_MODE wins; when it is missing, demo mode is ON only
//     if no real API URL is configured, so a deployment that forgot
//     its variables still works instead of calling a dead server
//   - GOOGLE_CLIENT_ID is a PUBLIC OAuth client id (not a secret)
//   - DEMO_EMAIL / DEMO_PASSWORD are the seeded sample account,
//     shared by the mock database and the login page hint
// ============================================================
const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
const rawDemoFlag = import.meta.env.VITE_DEMO_MODE;
const rawGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Base URL of the real ASP.NET Core API (undefined in pure demo builds)
export const API_BASE_URL: string | undefined = rawApiUrl ? rawApiUrl : undefined;

// True when the app must run entirely in the browser with mock data
export const DEMO_MODE: boolean =
    rawDemoFlag === "true" || (rawDemoFlag !== "false" && !API_BASE_URL);

// Google OAuth Web Client ID, or undefined when Google sign-in is not configured
export const GOOGLE_CLIENT_ID: string | undefined = rawGoogleClientId
    ? rawGoogleClientId.trim()
    : undefined;

// Seeded sample account available in demo mode
export const DEMO_EMAIL = "demo@methix.app";
export const DEMO_PASSWORD = "demo1234";
