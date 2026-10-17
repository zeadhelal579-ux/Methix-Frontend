// ============================================================
// File: src/components/auth/GoogleAuthSection.tsx
// Purpose: "or" divider + Google button + its error message, shared by
//          the Login and Register pages
// Logic:
//   - Owns the whole Google flow so both pages stay tiny: when
//     GoogleSignInButton reports an ID token, it is sent through
//     useAuth().loginWithGoogle (POST /auth/google). On success the
//     session is already stored by the hook, so this just navigates
//     to "/" and FarmBootstrapGuard decides where the user lands
//     (Dashboard, or /create-farm for a brand-new account)
//   - A failed sign-in (rejected token, server down) or a script load
//     failure is shown inline under the button, never silently
// ============================================================
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage } from "@/utils/errorMessages";

interface GoogleAuthSectionProps {
    // Controls the button wording ("Sign in with Google" / "Sign up with Google")
    mode: "signin" | "signup";
}

// Divider and Google sign-in block placed under the email form
export function GoogleAuthSection({ mode }: GoogleAuthSectionProps) {
    const navigate = useNavigate();
    const { loginWithGoogle, isGoogleLoggingIn, googleError } = useAuth();
    const [widgetError, setWidgetError] = useState<string | null>(null);

    // Send the Google ID token to the backend, then enter the app
    const handleCredential = useCallback(
        async (credential: string) => {
            setWidgetError(null);
            try {
                await loginWithGoogle(credential);
                navigate("/");
            } catch {
                // Error is already exposed through googleError below
            }
        },
        [loginWithGoogle, navigate]
    );

    const message = googleError
        ? getAuthErrorMessage(googleError, "Google sign-in failed. Please try again.")
        : widgetError;

    return (
        <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-outline-variant" />
                <span className="text-xs text-on-surface-variant">or</span>
                <div className="h-px flex-1 bg-outline-variant" />
            </div>

            <GoogleSignInButton
                text={mode === "signup" ? "signup_with" : "signin_with"}
                onCredential={handleCredential}
                onError={setWidgetError}
                disabled={isGoogleLoggingIn}
            />

            {isGoogleLoggingIn && (
                <p className="text-center text-sm text-on-surface-variant">Signing you in with Google...</p>
            )}

            {message && (
                <p className="text-center text-sm text-error" role="alert">
                    {message}
                </p>
            )}
        </div>
    );
}
