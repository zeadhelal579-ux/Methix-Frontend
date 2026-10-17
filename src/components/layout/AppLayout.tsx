// ============================================================
// File: src/components/layout/AppLayout.tsx
// Purpose: Shell wrapping Sidebar + Topbar around every protected
//          page's content, per Frontend Architecture routing spec
// Logic:
//   - Uses React Router's <Outlet /> so App.tsx can nest all
//     protected routes under this one layout without repeating
//     Sidebar/Topbar on every page component
//   - Owns the "mobile menu is open" flag: from the lg breakpoint up
//     the sidebar is a permanent column, below it the sidebar becomes
//     a slide-in drawer opened from the Topbar's menu button
//   - h-dvh (dynamic viewport height) instead of h-screen, so the
//     layout is not cut off by the mobile browser's address bar
// ============================================================
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// Layout shell for all authenticated pages (Dashboard, Cattle, etc.)
export function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-dvh bg-background">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
