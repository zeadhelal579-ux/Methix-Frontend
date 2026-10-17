// ============================================================
// File: src/pages/Register.tsx
// Purpose: Public registration page for new Farmer accounts
// Logic:
//   - Same pattern as Login.tsx: local form state, submits via
//     useAuth().register, redirects to "/" on success
//   - New accounts default to the "Farmer" role on the backend
//     (per AuthService.cs), so no role selector is shown here
//   - Below the form: "Sign up with Google" (GoogleAuthSection)
//   - The error text depends on the failure: duplicate email (409),
//     server unreachable, or a generic fallback
//   - Already-authenticated visitors are redirected straight to "/"
// ============================================================
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GoogleAuthSection } from "@/components/auth/GoogleAuthSection";
import { useAuth } from "@/hooks/useAuth";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";

export default function Register() {
    const navigate = useNavigate();
    const { isAuthenticated, register, isRegistering, registerError } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Submit the new account, then redirect to the dashboard on success
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        try {
            await register({ name, email, password });
            navigate("/");
        } catch {
            // Error is already exposed via registerError below; nothing else to do
        }
    }

    // Already signed in: skip the form
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm rounded-md border border-outline-variant bg-surface-container-lowest p-8">
                <h1 className="font-display text-2xl font-semibold text-on-surface">METHIX</h1>
                <p className="mt-1 text-sm text-on-surface-variant">Create your farm account</p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-on-surface-variant">Full name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                            className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-on-surface-variant">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-on-surface-variant">Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </label>

                    {registerError && (
                        <p className="text-sm text-error" role="alert">
                            {getFriendlyErrorMessage(
                                registerError,
                                "Could not create your account. Please check your details and try again."
                            )}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isRegistering}
                        className="h-10 rounded-md bg-primary text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isRegistering ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <GoogleAuthSection mode="signup" />

                <p className="mt-6 text-center text-sm text-on-surface-variant">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}