"use client";

import React, { useState } from "react";
import { AdminUserDto } from "@/types";
import { updateAdminUser } from "@/lib/actions/admin.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Search,
    ShieldAlert,
    ShieldCheck,
    CheckCircle2,
    Ban,
    Database,
    Sparkles,
    Loader2,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserManagementTableProps {
    initialUsers: AdminUserDto[];
}

export default function UserManagementTable({ initialUsers }: UserManagementTableProps) {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUserDto[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleToggleStatus = async (user: AdminUserDto) => {
        const isCurrentActive = user.status?.toLowerCase() === "active";
        const targetStatus = isCurrentActive ? "banned" : "active";

        setLoadingId(user.id);
        try {
            const updatedUser = await updateAdminUser(user.id, { status: targetStatus });
            if (updatedUser) {
                setUsers((prev) =>
                    prev.map((item) =>
                        item.id === user.id ? { ...item, status: targetStatus } : item
                    )
                );
                toast.success(
                    isCurrentActive
                        ? `Account for ${user.fullName || user.email} has been banned.`
                        : `Account for ${user.fullName || user.email} has been reactivated.`
                );
                router.refresh();
            } else {
                toast.error("Failed to update user status. Please try again.");
            }
        } catch {
            toast.error("An error occurred while communicating with the server.");
        } finally {
            setLoadingId(null);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.tierName && u.tierName.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && u.status?.toLowerCase() === "active") ||
            (statusFilter === "banned" && u.status?.toLowerCase() === "banned");

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search accounts by name, email, role, or tier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-1">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Status:</span>
                    </div>
                    {(["all", "active", "banned"] as const).map((tab) => (
                        <Button
                            key={tab}
                            type="button"
                            variant={statusFilter === tab ? "default" : "outline"}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer h-8 ${
                                statusFilter === tab
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            {tab}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <th className="py-3.5 px-5 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Identity</th>
                                <th className="py-3.5 px-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="py-3.5 px-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan & Quotas</th>
                                <th className="py-3.5 px-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="py-3.5 px-5 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Enforcement Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center font-medium text-slate-400">
                                        No matching user accounts found in inventory
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isActive = user.status?.toLowerCase() === "active";
                                    const isBanned = user.status?.toLowerCase() === "banned";
                                    const isLoading = loadingId === user.id;
                                    const storageUsed = user.currentStorageCapacity ?? 0;
                                    const storageLimit = user.tierStorageLimitMb ?? 0;
                                    const tokensUsed = user.currentAiTokenUsage ?? 0;
                                    const tokensLimit = user.tierAiTokens ?? 0;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs shrink-0">
                                                        {(user.fullName || user.email || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="font-extrabold text-slate-900 dark:text-white leading-tight">
                                                            {user.fullName || "Unnamed User"}
                                                        </p>
                                                        <p className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                                                            {user.email || "No Email Registered"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-extrabold text-[11px] uppercase tracking-wide ${
                                                    user.role?.toLowerCase() === "admin"
                                                        ? "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60"
                                                        : "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60"
                                                }`}>
                                                    {user.role || "User"}
                                                </span>
                                            </td>

                                            <td className="py-4 px-4 space-y-1.5">
                                                <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    {user.tierName || "Standard Plan"}
                                                </span>
                                                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Database className="w-3 h-3 text-slate-400" />
                                                        {storageUsed.toLocaleString()} / {storageLimit.toLocaleString()} MB
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} AI Tokens
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ${
                                                    isActive
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70"
                                                        : isBanned
                                                        ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/70"
                                                        : "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                                }`}>
                                                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                                                    {isBanned && <Ban className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />}
                                                    <span className="capitalize">{user.status || "Unknown"}</span>
                                                </span>
                                            </td>

                                            <td className="py-4 px-5 text-right">
                                                <Button
                                                    type="button"
                                                    disabled={isLoading}
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                                                        isActive
                                                            ? "bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-400"
                                                            : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400"
                                                    }`}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                                    ) : isActive ? (
                                                        <>
                                                            <ShieldAlert className="w-4 h-4 shrink-0" />
                                                            <span>Ban Account</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck className="w-4 h-4 shrink-0" />
                                                            <span>Activate Account</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
