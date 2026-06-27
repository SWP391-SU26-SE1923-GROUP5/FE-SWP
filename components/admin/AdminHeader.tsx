"use client";

import { Bell, ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
                <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="admin-header-title">{current.name}</h1>
                    {current.description && (
                        <span className="hidden xl:inline-flex items-center gap-1 rounded-full bg-light-300/50 px-2 py-0.5 text-xs text-light-400">
                            <span className="admin-badge-dot bg-brand/40" />
                            {current.description}
                        </span>
                    )}
                </div>
                <p className="admin-header-subtitle hidden sm:block">SmartStore Admin Console</p>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    href="/home"
                    className="hidden md:flex items-center gap-2 rounded-xl border border-light-300 bg-white px-3 py-2 text-sm text-light-400 shadow-sm hover:border-brand hover:text-brand transition-colors"
                >
                    User App
                    <ExternalLink className="size-3.5" />
                </Link>
                <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-xl border border-light-300 bg-white text-light-100 transition hover:bg-light-300 hover:text-dark-100"
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
