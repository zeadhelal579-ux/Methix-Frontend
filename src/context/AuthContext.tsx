// ============================================================
// File: src/context/AuthContext.tsx
// Purpose: Global authentication state (current user + JWT token)
// Logic:
//   - Persists the token and user object in localStorage so the
//     session survives a page refresh
//   - Exposes login()/logout() so any component can update auth
//     state in one place, instead of touching localStorage directly
//   - ProtectedRoute (in App.tsx) reads isAuthenticated from here
//     to guard private pages
//   - The backend's AuthResponse DTO is NESTED: { token, user: {
//     userId, name, email, role } } — confirmed directly against
//     AuthResponse.cs, so login() stores auth.user as-is, no mapping
//     needed
//   - readStoredUser() is wrapped in try/catch: any corrupted or
//     legacy localStorage value (e.g. the literal string "undefined"
//     from a past bug) must never crash the whole app on load
//   - logout() also empties the TanStack Query cache. Without this, the
//     next person to log in on the same tab would briefly be served the
//     previous user's cached farm / cattle data (the "farm/me" entry in
//     particular would put them straight into someone else's farm)
// ============================================================
import { createContext, useContext, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthResponse, User } from "@/types/user";
import { useFarmContext } from "@/context/FarmContext";

interface AuthContextValue {
    user: User | null;
    isAuthenticated: boolean;
    // Store the token + user after a successful login/register call
    login: (auth: AuthResponse) => void;
    // Clear the session and redirect to /login (handled by axiosClient too on 401)
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "methix_token";
const USER_KEY = "methix_user";

// Safely reads and parses the stored user, self-healing on corrupted data
function readStoredUser(): User | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as User;
    } catch {
        // Corrupted/legacy value (e.g. the string "undefined") — wipe it
        // instead of letting JSON.parse crash the entire app on mount.
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        return null;
    }
}

// Provider wrapping the whole app in main.tsx / App.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
    // Lazy init: read any existing session from localStorage once on mount
    const [user, setUser] = useState<User | null>(readStoredUser);
    const { resetFarm } = useFarmContext();
    const queryClient = useQueryClient();

    // Save token + user after a successful login or register.
    // auth.user is already in the exact shape this app uses internally,
    // since the backend's AuthResponse is nested — no mapping needed.
    function login(auth: AuthResponse) {
        localStorage.setItem(TOKEN_KEY, auth.token);
        localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
        setUser(auth.user);
    }

    // Clear the session entirely, including the selected farm and every
    // cached server response, so the next user to log in on this tab
    // doesn't inherit any of the previous user's data
    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        resetFarm();
        queryClient.clear();
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook to read auth state from any component
// eslint-disable-next-line react-refresh/only-export-components -- Provider + hook are intentionally co-located
export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return ctx;
}