import {
    LayoutDashboard,
    Users,
    Files,
    Settings,
    Flag,
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
        name: "Users",
        url: "/admin/users",
        icon: Users,
        description: "Manage user accounts and roles",
    },
    {
        name: "Files",
        url: "/admin/files",
        icon: Files,
        description: "Browse and moderate uploaded files",
    },
    {
        name: "Reports",
        url: "/admin/reports",
        icon: Flag,
        description: "Manage reported documents",
    },
    {
        name: "Settings",
        url: "/admin/settings",
        icon: Settings,
        description: "System information and configuration",
    },
];
