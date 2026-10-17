// ============================================================
// File: src/lib/google.ts
// Purpose: Helpers for "Sign in with Google" (Google Identity Services)
// Logic:
//   - loadGoogleScript(): injects the official GIS script once and
//     resolves when window.google is ready; the same promise is reused
//     if several components ask for it, and a failed load can be retried
//   - makeDemoGoogleCredential(): builds an UNSIGNED, Google-shaped ID
//     token for a sample account. Used only when no Google client id is
//     configured in demo mode, so the button still demonstrates the full
//     sign-in flow. A real backend must never accept such a token: it
//     must verify Google's signature, audience and expiry
// ============================================================
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

// Shared in-flight/finished load, so the script is added to the page once
let scriptPromise: Promise<void> | null = null;

// Loads the Google Identity Services script (resolves immediately if present)
export function loadGoogleScript(): Promise<void> {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = GOOGLE_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            // Allow a later retry (e.g. after the network comes back)
            scriptPromise = null;
            script.remove();
            reject(new Error("Could not load Google sign-in."));
        };
        document.head.appendChild(script);
    });

    return scriptPromise;
}

// Encodes a string as base64url, keeping non-ASCII characters (UTF-8) intact
function toBase64Url(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Returns a fake, unsigned Google ID token for a sample account (demo only)
export function makeDemoGoogleCredential(): string {
    const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = toBase64Url(
        JSON.stringify({
            iss: "https://accounts.google.com",
            sub: "demo-google-user",
            name: "Google Demo User",
            email: "google.demo@methix.app",
            email_verified: true,
        })
    );
    return `${header}.${payload}.demo-signature`;
}
