// ============================================================
// File: src/main.tsx
// Purpose: Application entry point
// Logic:
//   - Wraps the whole app in, from outside in:
//     ErrorBoundary (crash safety net) > BrowserRouter (routing) >
//     QueryClientProvider (server state) > FarmProvider >
//     AuthProvider (global app state)
//   - This order matters: AuthProvider is nested inside FarmProvider
//     so AuthContext.logout() can call useFarmContext().resetFarm()
//     to clear the previously selected farm on logout
//   - The shared QueryClient does not retry 4xx answers (a 401/403/404
//     will not fix itself, retrying only delays the error message by
//     seconds), retries anything else once, and does not refetch every
//     time the browser tab regains focus
//   - ErrorBoundary sits outermost, above the router, so it can
//     catch an unhandled render error on ANY page rather than being
//     scoped to one route — this closes the "no global Error
//     Boundary anywhere" gap documented in
//     01-frontend-architecture.md §5
// ============================================================
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { isAxiosError } from "axios";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { FarmProvider } from "@/context/FarmContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import App from "./App";
import "./index.css";

// Single shared QueryClient instance for the whole app
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (isAxiosError(error) && error.response && error.response.status < 500) {
                    return false;
                }
                return failureCount < 1;
            },
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <FarmProvider>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </FarmProvider>
                </QueryClientProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </StrictMode>
);