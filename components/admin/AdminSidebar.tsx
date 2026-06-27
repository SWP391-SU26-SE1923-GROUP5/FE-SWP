"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminNavItems, type AdminNavItem } from "@/constants/admin-nav";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import { cn } from "@/lib/utils";
import { signOutUser } from "@/lib/actions/user.actions";

interface AdminSidebarProps {
    fullName: string;
    email: string;
    avatar?: string;
    userCount?: number;
    fileCount?: number;
    reportCount?: number;
}

export default function AdminSidebar({ fullName, email, avatar, userCount, fileCount, reportCount }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);

    const getBadgeCount = (item: AdminNavItem): number | undefined => {
        if (item.url === "/admin/users") return userCount;
        if (item.url === "/admin/files") return fileCount;
        if (item.url === "/admin/reports") return reportCount;
        return undefined;
    };

    const handleSignOut = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await signOutUser();
        } catch (error) {
            console.error(error);
            toast.error("Could not sign out. Please try again.");
            setSigningOut(false);
        }
    };

    return (
        <aside className="admin-sidebar" data-testid="admin-sidebar">
            <Link href="/admin" className="admin-sidebar-brand">
                <Image
                    src="/assets/icons/logo-brand.svg"
                    alt="SmartStore Admin"
                    width={36}
                    height={36}
                    className="size-9"
                />
                <div>
                    <p className="text-sm font-semibold text-dark-100">SmartStore</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Admin Console</p>
                </div>
            </Link>

            <p className="admin-sidebar-section">Navigation</p>
            <nav className="flex flex-col gap-1">
                {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.url || (item.url !== "/admin" && pathname.startsWith(item.url));
                    const badge = getBadgeCount(item);
                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={cn("admin-sidebar-link", isActive && "admin-sidebar-link-active")}
                        >
                            <Icon className="admin-sidebar-icon" />
                            <div className="flex-1 truncate flex items-center justify-between">
                                <span className="block">{item.name}</span>
                                {badge !== undefined && badge > 0 && (
                                    <span className={cn(
                                        "flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1.5",
                                        isActive ? "bg-white/20 text-white" : "bg-brand/15 text-brand"
                                    )}>
                                        {badge > 99 ? "99+" : badge}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto rounded-2xl border border-light-300 bg-light-300/30 p-3">
                <div className="flex items-center gap-3">
                    <Image
                        src={avatar || avatarPlaceholderUrl}
                        alt={fullName}
                        width={40}
                        height={40}
                        className="size-10 rounded-full object-cover"
                        unoptimized
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-dark-100">{fullName}</p>
                        <p className="truncate text-xs text-light-400">{email}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red/10 px-3 py-2 text-xs font-semibold text-red transition hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <LogOut className="size-4" />
                    {signingOut ? "Signing out..." : "Sign out"}
                </button>
            </div>
        </aside>
    );
}
