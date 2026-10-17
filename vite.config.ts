// ============================================================
// File: vite.config.ts
// Purpose: Main Vite configuration for the METHIX frontend app
// Logic:
//   - Registers the React plugin for JSX/TSX support
//   - Registers the Tailwind CSS v4 plugin (CSS-first config)
//   - Sets up the "@" path alias pointing to "src", required by
//     shadcn/ui and used across the whole project for clean imports
//   - Raises the chunk-size warning limit: the charting library alone
//     is larger than Vite's 500 kB default, and the warning is noise
// ============================================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        chunkSizeWarningLimit: 900,
    },
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
});