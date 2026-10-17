/// <reference types="vite/client" />

// ============================================================
// File: src/vite-env.d.ts
// Purpose: Type declarations for the Vite environment variables
//          this app reads through import.meta.env
// Logic:
//   - Only variables prefixed with VITE_ are exposed to browser code
//   - All of them are optional strings, because every one has a
//     safe fallback in src/config/env.ts
// ============================================================
interface ImportMetaEnv {
    readonly VITE_DEMO_MODE?: string;
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
