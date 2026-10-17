// ============================================================
// File: src/App.tsx
// Purpose: Top-level route table for the whole application
// Logic:
//   - Three nested guard tiers, exactly matching the routing table
//     in Frontend Architecture: public routes (Login/Register) ->
//     ProtectedRoute (auth check) -> FarmBootstrapGuard (farm
//     check, skipped only by /create-farm) -> AppLayout (Sidebar +
//     Topbar chrome) around every farm-dependent page
//   - Each guard renders <Outlet /> rather than repeating chrome,
//     so a page component only ever needs to handle its own content
//   - Any unknown URL is sent to "/" (the guards then route a
//     signed-out visitor to /login) instead of rendering a blank page
// ============================================================
import { Navigate, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { FarmBootstrapGuard } from "@/components/common/FarmBootstrapGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CreateFarm from "@/pages/CreateFarm";
import Dashboard from "@/pages/Dashboard";
import CattleList from "@/pages/CattleList";
import CattleDetail from "@/pages/CattleDetail";
import Predictions from "@/pages/Predictions";
import Settings from "@/pages/Settings";

export default function App() {
    return (
        <Routes>
            {/* Public routes — no Sidebar/Topbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected, but farm-independent: reached only via
                FarmBootstrapGuard's redirect for a user with no farm yet */}
            <Route element={<ProtectedRoute />}>
                <Route path="/create-farm" element={<CreateFarm />} />

                {/* Protected AND requires a farm — everything else */}
                <Route element={<FarmBootstrapGuard />}>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/cattle" element={<CattleList />} />
                        <Route path="/cattle/:cattleId" element={<CattleDetail />} />
                        <Route path="/predictions" element={<Predictions />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                </Route>
            </Route>

            {/* Unknown URL: fall back to the app root */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}