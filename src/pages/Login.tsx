// ============================================================
// File: src/pages/Login.tsx
// Purpose: Public login page — entry point before any protected
//          route is accessible
// Logic:
//   - Local form state (email/password), submits via useAuth().login
//   - On success, AuthContext stores the session and this page
//     navigates to "/" (Dashboard); ProtectedRoute then lets the
//     user through automatically
//   - Displays the error inline, without a page reload: wrong
//     credentials (401) and "server unreachable" get different texts
//   - Below the form: "Sign in with Google" (GoogleAuthSection)
//   - Already-authenticated visitors are redirected straight to "/"
//   - In demo mode a hint box shows the sample account with a
//     one-click button to sign in as that user
//   - "Forgot password?" is rendered as an inert element, not a
//     Link: no password-recovery endpoint exists in AuthController
//     (Backend Architecture only documents /register and /login),
//     so wiring it to a route would be a dead link. It stays here
//     only to match the reference mockup's layout; it will become
//     a real Link once that endpoint exists
// ============================================================
import { useState, type FormEvent } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GoogleAuthSection } from "@/components/auth/GoogleAuthSection";
import { DEMO_EMAIL, DEMO_MODE, DEMO_PASSWORD } from "@/config/env";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/utils/errorMessages";

export default function Login() {
    const navigate = useNavigate();
    const { isAuthenticated, login, isLoggingIn, loginError } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Submit credentials, then redirect to the dashboard on success
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        await signIn(email, password);
    }

    // Shared by the form and the one-click demo button
    async function signIn(emailValue: string, passwordValue: string) {
        try {
            await login({ email: emailValue, password: passwordValue });
            navigate("/");
        } catch {
            // Error is already exposed via loginError below; nothing else to do
        }
    }

    // Already signed in: skip the form
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm rounded-md border border-outline-variant bg-surface-container-lowest p-8">
                <div className="text-center">
                    <h1 className="font-display text-2xl font-bold text-primary">METHIX</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">Agri-Intelligence</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-on-surface-variant">Email</span>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                autoFocus
                                className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-lowest pl-9 pr-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-on-surface-variant">Password</span>
                            {/* Inert placeholder — see file header for why this
                                isn't a real Link yet */}
                            <span className="cursor-not-allowed text-xs font-medium text-primary/60">
                                Forgot password?
                            </span>
                        </div>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-lowest pl-9 pr-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </label>

                    {loginError && (
                        <p className="text-sm text-error" role="alert">
                            {getAuthErrorMessage(loginError, "Could not log in. Please try again.")}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoggingIn ? "Logging in..." : "Log in"}
                        {!isLoggingIn && <ArrowRight className="h-4 w-4" />}
                    </button>
                </form>

                <GoogleAuthSection mode="signin" />

                {DEMO_MODE && (
                    <div className="mt-6 rounded-md border border-outline-variant bg-surface-container-low p-3 text-xs text-on-surface-variant">
                        <p className="font-medium text-on-surface">Demo mode</p>
                        <p className="mt-1">
                            This build runs entirely in your browser, with no server. Use the sample account
                            or create your own:
                        </p>
                        <p className="mt-1 tabular-nums">
                            {DEMO_EMAIL} / {DEMO_PASSWORD}
                        </p>
                        <button
                            type="button"
                            onClick={() => signIn(DEMO_EMAIL, DEMO_PASSWORD)}
                            disabled={isLoggingIn}
                            className="mt-2 font-medium text-primary hover:underline disabled:opacity-60"
                        >
                            Sign in with the demo account
                        </button>
                    </div>
                )}

                <p className="mt-6 text-center text-sm text-on-surface-variant">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-medium text-primary hover:underline">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}