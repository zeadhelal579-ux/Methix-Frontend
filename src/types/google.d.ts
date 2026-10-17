// ============================================================
// File: src/types/google.d.ts
// Purpose: Minimal TypeScript declarations for the parts of Google
//          Identity Services (GIS) this app uses
// Logic:
//   - GIS is loaded at runtime from accounts.google.com/gsi/client
//     (no npm package), which attaches `google` to window
//   - Only the subset needed for "Sign in with Google" is described:
//     initialize() and renderButton() from google.accounts.id
//   - Reference: https://developers.google.com/identity/gsi/web/reference/js-reference
// ============================================================
export {};

declare global {
    // Response handed to the callback after the user picks an account
    interface GoogleCredentialResponse {
        // The Google ID token (a signed JWT) to send to the server
        credential: string;
        select_by?: string;
    }

    interface GoogleIdConfiguration {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode?: "popup" | "redirect";
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
    }

    interface GoogleButtonConfiguration {
        type?: "standard" | "icon";
        theme?: "outline" | "filled_blue" | "filled_black";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        shape?: "rectangular" | "pill" | "circle" | "square";
        logo_alignment?: "left" | "center";
        width?: number;
        locale?: string;
    }

    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (configuration: GoogleIdConfiguration) => void;
                    renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
                    disableAutoSelect: () => void;
                };
            };
        };
    }
}
