// ============================================================
// File: src/components/layout/Topbar.tsx
// Purpose: Top bar shown on every protected page — menu button
//          (small screens), breadcrumb tabs (left), and farm name /
//          notifications / help / user avatar / logout (right)
// Logic:
//   - "Farm Overview" tab is always shown and links back to "/".
//     A second "Cattle Detail" tab appears only while viewing
//     /cattle/:cattleId, matching the two-tab state shown in the
//     Cattle Detail mockup (vs. the single-tab state everywhere
//     else); detected via useLocation + matchPath instead of
//     hardcoding the route in every page component
//   - Reads the current farm via useFarm(farmId) (React Query),
//     and the current user via useAuth() (AuthContext)
//   - The farm name is a plain label, not a button: no
//     "list every farm this user can access" endpoint exists yet, so a
//     dropdown arrow would promise a switcher that cannot open.
//     Notifications and Help are rendered disabled for the same reason
//     (nothing is behind them yet)
//   - Shows the Google profile picture when the user signed in with
//     Google, otherwise the first letter of their name
//   - Shows a small "Demo mode" pill when running on mock data
//   - Responsive: the menu button (opens the Sidebar drawer) only
//     exists below the lg breakpoint, and secondary items hide on
//     narrow screens so the bar never overflows
// ============================================================
import { Bell, CircleHelp, LogOut, Menu } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFarm } from "@/hooks/useFarm";
import { useFarmContext } from "@/context/FarmContext";
import { DEMO_MODE } from "@/config/env";
import { cn } from "@/lib/utils";

interface TopbarProps {
    onMenuClick: () => void;
}

// Top bar: menu + breadcrumb tabs (left) and farm label and utility actions (right)
export function Topbar({ onMenuClick }: TopbarProps) {
    const { user, logout } = useAuth();
    const { farmId } = useFarmContext();
    const { data: farm } = useFarm(farmId);
    const location = useLocation();

    // Only the Cattle Detail route shows a second tab; every other
    // protected page shows just the single "Farm Overview" tab
    const isCattleDetail = !!matchPath("/cattle/:cattleId", location.pathname);

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-lowest px-3 sm:px-6">
            <div className="flex h-full min-w-0 items-center gap-2 sm:gap-4">
                {/* Opens the sidebar drawer; hidden once the sidebar is permanent */}
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open navigation menu"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container lg:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Breadcrumb tabs: always "Farm Overview", plus "Cattle
                    Detail" only while on that page */}
                <nav className="flex h-full items-center gap-4 sm:gap-6">
                    <Link
                        to="/"
                        className={cn(
                            "flex h-full items-center whitespace-nowrap border-b-2 text-sm font-medium",
                            isCattleDetail
                                ? "border-transparent text-on-surface-variant hover:text-on-surface"
                                : "border-primary text-on-surface"
                        )}
                    >
                        Farm Overview
                    </Link>

                    {isCattleDetail && (
                        <span className="flex h-full items-center whitespace-nowrap border-b-2 border-primary text-sm font-medium text-on-surface">
                            Cattle Detail
                        </span>
                    )}
                </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                {DEMO_MODE && (
                    <span className="hidden rounded-full bg-tertiary-container/20 px-2.5 py-1 text-xs font-medium text-tertiary sm:inline">
                        Demo mode
                    </span>
                )}

                {farm?.name && (
                    <span className="hidden max-w-40 truncate text-sm font-medium text-on-surface md:inline">
                        {farm.name}
                    </span>
                )}

                <button
                    type="button"
                    disabled
                    title="Notifications are coming soon"
                    aria-label="Notifications (coming soon)"
                    className="hidden h-9 w-9 items-center justify-center rounded-full text-on-surface-variant opacity-60 sm:flex"
                >
                    <Bell className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    disabled
                    title="Help is coming soon"
                    aria-label="Help (coming soon)"
                    className="hidden h-9 w-9 items-center justify-center rounded-full text-on-surface-variant opacity-60 sm:flex"
                >
                    <CircleHelp className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                    {user?.picture ? (
                        <img
                            src={user.picture}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-on-primary">
                            {user?.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                    )}
                    <span className="hidden max-w-32 truncate text-sm font-medium text-on-surface md:inline">
                        {user?.name}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={logout}
                    aria-label="Log out"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}
