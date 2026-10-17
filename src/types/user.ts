// ============================================================
// File: src/types/user.ts
// Purpose: Type definitions for authentication and user data
// Logic:
//   - AuthResponse mirrors the EXACT nested shape returned by the
//     backend's AuthResponse DTO (AuthController: /register, /login):
//     { token, user: { userId, name, email, role } } — confirmed
//     directly against Methix.Api.DTOs.Auth.AuthResponse.cs
//     (AuthResponse.User is an AuthUserDto with UserId/Name/Email/Role)
//   - GoogleLoginRequest carries the Google ID token for "Continue with
//     Google"; the server verifies it and answers with the same
//     AuthResponse shape as a normal login
//   - "Role" is restricted to the two roles seeded in the
//     database (Farmer / Admin), matching SQL Architecture
// ============================================================

// User role, matching the seeded Roles table (Farmer / Admin)
export type Role = "Farmer" | "Admin";

// Authenticated user shape, matches the backend's nested AuthUserDto.
// picture is only present for accounts that signed in with Google.
export interface User {
    userId: number;
    name: string;
    email: string;
    role: Role;
    picture?: string;
}

// Request body for POST /api/auth/login
export interface LoginRequest {
    email: string;
    password: string;
}

// Request body for POST /api/auth/register
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

// Request body for POST /api/auth/google: the Google ID token (a JWT
// issued by Google Identity Services) that the server must verify
export interface GoogleLoginRequest {
    credential: string;
}

// Response returned by the login, register and Google sign-in endpoints.
// Nested shape — matches Methix.Api.DTOs.Auth.AuthResponse exactly:
// { token, user: { userId, name, email, role } }
export interface AuthResponse {
    token: string;
    user: User;
}