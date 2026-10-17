// ============================================================
// File: src/api/authApi.ts
// Purpose: All authentication-related backend calls
// Logic:
//   - Wraps POST /api/auth/login, POST /api/auth/register and
//     POST /api/auth/google (Google sign-in)
//   - Used only by Login.tsx and Register.tsx (through useAuth)
// ============================================================
import { axiosClient } from "./axiosClient";
import type { AuthResponse, GoogleLoginRequest, LoginRequest, RegisterRequest } from "@/types/user";

// Log the user in and return the JWT token + user info
export async function login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>("/auth/login", payload);
    return data;
}

// Register a new Farmer account and return the JWT token + user info
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>("/auth/register", payload);
    return data;
}

// Sign in (or sign up) with a Google ID token and return the session.
// The server must verify the token's signature, audience and expiry
// before trusting the email inside it.
export async function loginWithGoogle(payload: GoogleLoginRequest): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>("/auth/google", payload);
    return data;
}
