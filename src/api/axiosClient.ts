// ============================================================
// File: src/api/axiosClient.ts
// Purpose: Single, centralized Axios instance for the whole app
// Logic:
//   - Sets the backend base URL once (from Vite env variable)
//   - Attaches the JWT token automatically to every outgoing
//     request via a request interceptor, so no Component or
//     other api/*.ts file ever has to do this manually
//   - Handles 401 responses globally: clears the stored token
//     AND user (both localStorage keys, matching AuthContext's
//     own logout()) and redirects to /login, since an expired/
//     invalid token means the user must re-authenticate
//   - EXCEPTION: /auth/login and /auth/register are excluded from
//     that global redirect. A 401 from those two endpoints just
//     means "wrong email/password", which is normal, expected
//     behavior that Login.tsx already displays inline via
//     loginError — it is not an expired session. Without this
//     exception, a failed login attempt would force a full
//     window.location.href reload back to /login, wiping out the
//     component's error message before the user ever saw it.
//   - DEMO MODE (see config/env.ts): when enabled, requests are not
//     sent over the network at all. A custom axios adapter hands each
//     request to the in-browser mock backend (src/mocks), which keeps
//     its data in localStorage. Everything above this file (api/*.ts,
//     hooks, pages) is identical in demo and real mode, and the
//     interceptors below still run in both
// ============================================================
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, DEMO_MODE } from "@/config/env";

// Lazy-loads the mock backend on first use, so a real-backend session
// never downloads it
async function demoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    const { handleDemoRequest } = await import("@/mocks/demoAdapter");
    return handleDemoRequest(config);
}

// Base Axios instance, all api/*.ts files must use this instead
// of importing axios directly (per Frontend Architecture rule)
export const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    ...(DEMO_MODE ? { adapter: demoAdapter } : {}),
});

// Request interceptor: attach JWT token from localStorage if present
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("methix_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle expired/invalid tokens globally.
// Clears both keys AuthContext uses (token + user) so localStorage
// never ends up in a state where a user object exists without a
// valid token — that mismatch would let ProtectedRoute think the
// session is still valid after it has actually expired.
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthEndpoint =
            error.config?.url?.includes("/auth/login") ||
            error.config?.url?.includes("/auth/register");

        if (error.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem("methix_token");
            localStorage.removeItem("methix_user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);