// ============================================================
// File: src/components/auth/GoogleSignInButton.tsx
// Purpose: The "Continue with Google" button used on Login/Register
// Logic:
//   - If VITE_GOOGLE_CLIENT_ID is set, it renders Google's OFFICIAL
//     button (Google Identity Services draws it inside our container,
//     which keeps the sign-in popup flow and branding rules intact).
//     When the user picks an account, Google hands back an ID token
//     which is passed up through onCredential
//   - If no client id is configured, it renders a look-alike button
//     that signs in with a sample Google account instead, so the demo
//     never shows a dead button. A small caption makes that explicit
//   - The official button is drawn at the container's width (Google
//     only accepts 200-400 px), so it fits narrow phone screens
//   - The latest callbacks are kept in refs, so the Google widget is
//     initialized once per mount instead of every time a parent
//     re-renders (GIS warns when initialize() is called repeatedly)
// ============================================================
import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "@/config/env";
import { loadGoogleScript, makeDemoGoogleCredential } from "@/lib/google";

interface GoogleSignInButtonProps {
    // "signin_with" -> "Sign in with Google", "signup_with" -> "Sign up with Google"
    text: "signin_with" | "signup_with";
    // Receives the Google ID token after the user chooses an account
    onCredential: (credential: string) => void;
    // Called when the Google script cannot be loaded
    onError: (message: string) => void;
    disabled?: boolean;
}

// Official multicolor Google "G" mark, used by the fallback button
function GoogleLogo() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

// Renders Google's official button, or a simulated one when not configured
export function GoogleSignInButton({ text, onCredential, onError, disabled = false }: GoogleSignInButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onCredentialRef = useRef(onCredential);
    const onErrorRef = useRef(onError);

    // Keep the refs pointing at the latest callbacks after every render
    useEffect(() => {
        onCredentialRef.current = onCredential;
        onErrorRef.current = onError;
    });

    // Load Google Identity Services and draw the official button once
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;
        let isCancelled = false;

        loadGoogleScript()
            .then(() => {
                const container = containerRef.current;
                if (isCancelled || !container || !window.google) return;

                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID as string,
                    callback: (response) => onCredentialRef.current(response.credential),
                });
                window.google.accounts.id.renderButton(container, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text,
                    shape: "rectangular",
                    logo_alignment: "left",
                    width: Math.min(400, Math.max(200, container.clientWidth || 320)),
                });
            })
            .catch(() => {
                if (!isCancelled) {
                    onErrorRef.current("Could not load Google sign-in. Check your connection and try again.");
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [text]);

    // Real Google button path
    if (GOOGLE_CLIENT_ID) {
        return (
            <div
                className={disabled ? "pointer-events-none opacity-60" : undefined}
                aria-busy={disabled}
            >
                <div ref={containerRef} className="flex min-h-10 justify-center" />
            </div>
        );
    }

    // Simulated path: no client id configured (demo)
    return (
        <div className="flex flex-col gap-2">
            <button
                type="button"
                onClick={() => onCredential(makeDemoGoogleCredential())}
                disabled={disabled}
                className="flex h-10 items-center justify-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest text-sm font-medium text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
            >
                <GoogleLogo />
                {text === "signup_with" ? "Sign up with Google" : "Sign in with Google"}
            </button>
            <p className="text-center text-xs text-on-surface-variant">
                Demo: no Google client id is configured, so this uses a sample Google account.
            </p>
        </div>
    );
}
