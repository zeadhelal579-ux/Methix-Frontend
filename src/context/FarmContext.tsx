// ============================================================
// File: src/context/FarmContext.tsx
// Purpose: Global state for the currently selected farm
// Logic:
//   - Stores only the selected farmId (a primitive), not the full
//     Farm object — the full farm data is server state and belongs
//     in TanStack Query via farmApi.getFarm(), not here
//   - Persists the selection in localStorage so it survives refresh
//   - Used by the Topbar farm dropdown and by any page/hook that
//     needs to know "which farm are we working on right now"
// ============================================================
import { createContext, useContext, useState, type ReactNode } from "react";

interface FarmContextValue {
    farmId: number | null;
    setFarmId: (farmId: number) => void;
    resetFarm: () => void;
}

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

const FARM_ID_KEY = "methix_farm_id";

// Provider wrapping the app, placed inside AuthProvider in App.tsx
export function FarmProvider({ children }: { children: ReactNode }) {
    // Lazy init: restore the last selected farm from localStorage
    const [farmId, setFarmIdState] = useState<number | null>(() => {
        const stored = localStorage.getItem(FARM_ID_KEY);
        return stored ? Number(stored) : null;
    });

    // Update the selected farm (Topbar dropdown) and persist it
    function setFarmId(id: number) {
        localStorage.setItem(FARM_ID_KEY, String(id));
        setFarmIdState(id);
    }

    // Clear the selected farm (called from AuthContext.logout(), so a
    // different user logging in on the same tab never inherits the
    // previous user's farmId before their own /farms/me call resolves)
    function resetFarm() {
        localStorage.removeItem(FARM_ID_KEY);
        setFarmIdState(null);
    }

    return (
        <FarmContext.Provider value={{ farmId, setFarmId, resetFarm }}>
            {children}
        </FarmContext.Provider>
    );
}

// Hook to read/set the current farm from any component
// eslint-disable-next-line react-refresh/only-export-components -- Provider + hook are intentionally co-located
export function useFarmContext() {
    const ctx = useContext(FarmContext);
    if (!ctx) {
        throw new Error("useFarmContext must be used within a FarmProvider");
    }
    return ctx;
}