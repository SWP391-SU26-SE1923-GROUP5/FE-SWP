'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {navItems} from "@/constants/nav";
import {usePathname} from "next/navigation";
import {cn} from "@/lib/utils";
import {avatarPlaceholderUrl} from "@/constants/avatar";
import { getMyStats } from "@/lib/actions/gamification.actions";
import { UserStatsResponseDto } from "@/types";
import { BarChart3, Bell, Trophy, Trash2 } from "lucide-react";

interface Props {
    fullName: string;
    avatar: string;
    email: string;
}

const renderNavIcon = (name: string, icon: string, isActive: boolean) => {
    if (name === "Analytics") {
        return <BarChart3 className={cn("w-[22px] h-[22px] text-slate-400 transition-colors shrink-0", isActive && "text-white")} />;
    }
    if (name === "Notifications") {
        return <Bell className={cn("w-[22px] h-[22px] text-slate-400 transition-colors shrink-0", isActive && "text-white")} />;
    }
    if (name === "Leaderboard") {
        return <Trophy className={cn("w-[22px] h-[22px] text-amber-500 transition-colors shrink-0", isActive && "text-white")} />;
    }
    if (name === "Trash Bin" || name === "Trash") {
        return <Trash2 className={cn("w-[22px] h-[22px] text-red-500/80 transition-colors shrink-0", isActive && "text-white")} />;
    }
    return (
        <Image
            src={icon}
            alt={name}
            width={22}
            height={22}
            className={cn(
                "nav-icon shrink-0",
                isActive && "nav-icon-active",
            )}
        />
    );
};

const Sidebar = ({fullName, avatar, email}: Props) => {
    const pathname = usePathname();
    const [stats, setStats] = useState<UserStatsResponseDto | null>(null);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await getMyStats();
                if (res) setStats(res);
            } catch {
                setStats(null);
            }
        }
        loadStats();
    }, []);

    const mainNavItems = navItems.filter((item) => item.section === "main");
    const insightNavItems = navItems.filter((item) => item.section === "insights");

    return (
        <aside className="sidebar !py-4">
            <Link href="/home" className="shrink-0">
                <Image
                    src="/assets/icons/logo-full-brand.svg"
                    alt="logo"
                    width={160}
                    height={50}
                    className="hidden h-auto lg:block"
                />

                <Image
                    src="/assets/icons/logo-brand.svg"
                    alt="logo"
                    width={52}
                    height={52}
                    className="lg:hidden"
                />
            </Link>

            <nav className="sidebar-nav !mt-3 flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1 space-y-3">
                <div className="space-y-1">
                    <div className="hidden lg:block px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        Storage
                    </div>
                    {mainNavItems.map(({url, name, icon}) => {
                        const isActive = pathname === url;
                        return (
                            <Link key={name} href={url} className="lg:w-full block">
                                <li className={cn("sidebar-nav-item !h-10", isActive && "shad-active")}>
                                    {renderNavIcon(name, icon, isActive)}
                                    <p className="hidden lg:block">{name}</p>
                                </li>
                            </Link>
                        );
                    })}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200/60">
                    <div className="hidden lg:block px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        Activity & Insights
                    </div>
                    {insightNavItems.map(({url, name, icon}) => {
                        const isActive = pathname === url;
                        return (
                            <Link key={name} href={url} className="lg:w-full block">
                                <li className={cn("sidebar-nav-item !h-10", isActive && "shad-active")}>
                                    {renderNavIcon(name, icon, isActive)}
                                    <p className="hidden lg:block">{name}</p>
                                </li>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="shrink-0 mt-auto pt-2 flex flex-col gap-2">
                {stats && (
                    <>
                        <Link href="/profile" className="hidden lg:flex flex-col gap-2 rounded-2xl p-3 bg-gradient-to-br from-[#10b981]/10 via-emerald-500/5 to-teal-500/10 border border-[#10b981]/30 hover:border-[#10b981]/60 hover:shadow-md transition-all duration-300 group cursor-pointer">
                            <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                        <span className="text-sm font-black">⚡</span>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-tight">Level</div>
                                        <div className="text-xs font-black text-dark-200 leading-tight">Level {stats.currentLevel}</div>
                                    </div>
                                </div>
                                {stats.currentStreak > 0 && (
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 font-extrabold text-[11px] shrink-0">
                                        <span>🔥</span>
                                        <span>{stats.currentStreak}d</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1 pt-1.5 border-t border-[#10b981]/15">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-500">Experience</span>
                                    <span className="font-black text-[#10b981]">{stats.totalXp.toLocaleString()} XP</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#10b981] to-teal-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(Math.round((stats.totalXp / (stats.totalXp + (stats.xpToNextLevel || 100))) * 100), 100)}%` }}
                                    />
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 text-right">
                                    {stats.xpToNextLevel.toLocaleString()} XP to Level {stats.currentLevel + 1}
                                </div>
                            </div>
                        </Link>
                        <Link href="/profile" className="flex lg:hidden flex-col items-center justify-center rounded-xl p-2 bg-gradient-to-br from-[#10b981]/10 to-teal-500/10 border border-[#10b981]/30 hover:bg-[#10b981]/20 transition-all cursor-pointer" title={`Level ${stats.currentLevel} - ${stats.totalXp} XP`}>
                            <span className="text-sm">⚡</span>
                            <span className="text-[9px] font-extrabold text-dark-200 mt-0.5">Lv.{stats.currentLevel}</span>
                        </Link>
                    </>
                )}

                <Link href="/profile" className="sidebar-user-info !mt-0 hover:bg-slate-100/80 transition-all cursor-pointer rounded-xl p-2">
                    <Image
                        src={avatarPlaceholderUrl}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="sidebar-user-avatar !w-9 !h-9"
                    />
                    <div className="hidden lg:block truncate">
                        <p className="subtitle-2 capitalize truncate leading-tight">{fullName}</p>
                        <p className="caption truncate text-slate-500">{email}</p>
                    </div>
                </Link>
            </div>
        </aside>
    )
}
export default Sidebar