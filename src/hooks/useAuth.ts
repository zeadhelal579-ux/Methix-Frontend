// ============================================================
// File: src/hooks/useAuth.ts
// Purpose: Hook for login/register/Google mutations + reading auth state
// Logic:
//   - Wraps authApi.login/register/loginWithGoogle in useMutation
//     (React Query) for automatic loading/error state on the
//     Login/Register forms
//   - On success, pushes the result into AuthContext via login()
//   - Re-exports auth state from AuthContext so components only
//     need to import from "hooks", not "context", for consistency
// ============================================================
import { useMutation } from "@tanstack/react-query";
import {
    login as loginApi,
    loginWithGoogle as loginWithGoogleApi,
    register as registerApi,
} from "@/api/authApi";
import { useAuthContext } from "@/context/AuthContext";
import type { LoginRequest, RegisterRequest } from "@/types/user";

export function useAuth() {
    const { user, isAuthenticated, login: setSession, logout } = useAuthContext();

    // Mutation for Login.tsx: calls the API, then stores the session
    const loginMutation = useMutation({
        mutationFn: (payload: LoginRequest) => loginApi(payload),
        onSuccess: (data) => setSession(data),
    });

    // Mutation for Register.tsx: calls the API, then stores the session
    const registerMutation = useMutation({
        mutationFn: (payload: RegisterRequest) => registerApi(payload),
        onSuccess: (data) => setSession(data),
    });

    // Mutation for "Continue with Google": sends the Google ID token,
    // then stores the returned session like a normal login
    const googleMutation = useMutation({
        mutationFn: (credential: string) => loginWithGoogleApi({ credential }),
        onSuccess: (data) => setSession(data),
    });

    return {
        user,
        isAuthenticated,
        logout,
        login: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,
        register: registerMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        registerError: registerMutation.error,
        loginWithGoogle: googleMutation.mutateAsync,
        isGoogleLoggingIn: googleMutation.isPending,
        googleError: googleMutation.error,
    };
}