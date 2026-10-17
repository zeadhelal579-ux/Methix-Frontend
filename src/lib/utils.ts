// ============================================================
// File: src/lib/utils.ts
// Purpose: Shared utility functions used across UI components
// Logic:
//   - "cn" merges Tailwind classes safely: clsx handles
//     conditional classes, tailwind-merge resolves conflicting
//     utility classes (e.g. "p-2" vs "p-4") by keeping the last one
// ============================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge and de-duplicate conditional Tailwind class names
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}