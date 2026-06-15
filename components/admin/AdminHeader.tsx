"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { adminNavItems } from "@/constants/admin-nav";

interface AdminHeaderProps {
    userLabel?: string;
}

export default function AdminHeader({ userLabel }: AdminHeaderProps) {
    const pathname = usePathname();
    const current = adminNavItems.find((item) => item.url === pathname) ??
        adminNavItems.find((item) => item.url !== "/admin" && pathname.startsWith(item.url)) ??
        adminNavItems[0];

    return (
        <header className="admin-header">
            <div>
                <h1 className="admin-header-title">{current.name}</h1>
                {current.description && <p className="admin-header-subtitle">{current.description}</p>}
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-light-300 bg-white px-3 py-2 text-sm text-light-400 shadow-sm">
                    <Search className="size-4" />
                    <span>Quick find</span>
                </div>
                <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-xl border border-light-300 bg-white text-light-100 transition hover:bg-light-300"
                    aria-label="Notifications"
                >
                    <Bell className="size-4" />
                </button>
                {userLabel && (
                    <div className="hidden lg:flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">
                        {userLabel}
                    </div>
                )}
            </div>
        </header>
    );
}
