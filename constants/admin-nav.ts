import {
    LayoutDashboard,
    Flag,
    Settings,
    type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
    name: string;
    url: string;
    icon: LucideIcon;
    description?: string;
}

export const adminNavItems: AdminNavItem[] = [
    {
        name: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
        description: "System overview and metrics",
    },
    {
        name: "Reports",
        url: "/admin/reports",
        icon: Flag,
        description: "Review submitted violation reports",
    },
    {
        name: "Settings",
        url: "/admin/settings",
        icon: Settings,
        description: "System information and configuration",
    },
];
