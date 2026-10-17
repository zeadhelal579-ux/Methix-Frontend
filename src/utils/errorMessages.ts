// ============================================================
// File: src/utils/errorMessages.ts
// Purpose: Turns a caught query/mutation error into a message
//          the farmer can actually understand
// Logic:
//   - After the backend's IDOR fix, requesting a farm/cattle
//     that isn't yours now returns HTTP 403 (Forbidden) instead
//     of just empty data — this needs its own clear message,
//     distinct from a generic "could not load" failure
//   - Adding a team member with an email that's already
//     registered returns HTTP 409 (Conflict) from the backend,
//     which also needs its own clear message
//   - A request that never got a response (server down, offline,
//     blocked by CORS) gets its own "can't reach the server" message
//     instead of a misleading one such as "wrong password"
//   - getAuthErrorMessage() adds the login-specific case: a 401 from
//     the auth endpoints means "wrong email or password"
//   - Falls back to the generic message for every other error
//     (500s, etc.), since those don't need a more specific explanation
// ============================================================
import axios from "axios";

// Returns a farmer-friendly message based on the error's HTTP status
export function getFriendlyErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return "Can't reach the server. Please check your connection and try again.";
        }
        if (error.response.status === 403) {
            return "You don't have access to this farm.";
        }
        if (error.response.status === 409) {
            return "This email is already registered.";
        }
    }
    return fallback;
}

// Same as getFriendlyErrorMessage, plus the sign-in specific 401 case
// (wrong credentials, or a Google token the server rejected)
export function getAuthErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
        return "Invalid email or password. Please try again.";
    }
    return getFriendlyErrorMessage(error, fallback);
}