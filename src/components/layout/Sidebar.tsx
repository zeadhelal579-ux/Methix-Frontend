// ============================================================
// File: src/components/layout/Sidebar.tsx
// Purpose: Left navigation sidebar (260px), per DESIGN.md layout spec
// Logic:
//   - Uses React Router's NavLink for automatic active-state
//     detection (no manual pathname comparison needed)
//   - Icons are 20px, stroke-based, neutral by default, shifting
//     to primary teal when the route is active (DESIGN.md > Side
//     Navigation spec)
//   - Brand block (icon + "METHIX" + "Agri-Intelligence" tagline)
//     matches the reference mockups exactly, since this is the
//     one element shown identically on every single screen
//   - Responsive: on large screens it is a static column. On small
//     screens it is a fixed drawer that slides in over a dimmed
//     backdrop (isOpen / onClose come from AppLayout), and tapping a
//     link or the backdrop closes it
// ============================================================
import { NavLink } from "react-router-dom";
import { FlaskConical, LayoutDashboard, Beef, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Nav items, in the order defined by Frontend Architecture routing table
const NAV_ITEMS = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/cattle", label: "Cattle", icon: Beef, end: false },
    { to: "/predictions", label: "Predictions", icon: LineChart, end: false },
    { to: "/settings", label: "Settings", icon: Settings, end: false },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// Navigation shown on every protected page (inside AppLayout)
export function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <>
            {/* Dimmed backdrop, only exists while the mobile drawer is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-on-surface/40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex w-(--spacing-sidebar-width) shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest transition-transform duration-200",
                    "lg:static lg:z-auto lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand block: teal icon tile + wordmark + tagline,
                    identical on every page per the reference mockups */}
                <div className="flex items-center gap-3 px-6 py-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary">
                        <FlaskConical className="h-5 w-5 text-on-primary" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="font-display text-lg font-bold text-primary">METHIX</span>
                        <span className="text-xs text-on-surface-variant">Agri-Intelligence</span>
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-1 px-3">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onClose}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary-container/10 text-primary"
                                        : "text-on-surface-variant hover:bg-surface-container"
                                )
                            }
                        >
                            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
