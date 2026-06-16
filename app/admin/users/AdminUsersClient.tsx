"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter } from "lucide-react";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminUserRow from "@/components/admin/AdminUserRow";
import AdminCreateUserDialog from "@/components/admin/AdminCreateUserDialog";
import AdminPagination from "@/components/admin/AdminPagination";
import EmptyState from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminUser, AdminUserListResponse } from "@/types/admin";

const ROLE_OPTIONS = [
    { value: "all", label: "All roles" },
    { value: "user", label: "Users" },
    { value: "admin", label: "Admins" },
];

const SORT_OPTIONS = [
    { value: "$createdAt-desc", label: "Newest first" },
    { value: "$createdAt-asc", label: "Oldest first" },
    { value: "name-asc", label: "Name A→Z" },
    { value: "name-desc", label: "Name Z→A" },
    { value: "email-asc", label: "Email A→Z" },
];

const PAGE_LIMIT = 20;

interface AdminUsersClientProps {
    currentUserId: string;
    initialData: AdminUserListResponse;
}

export default function AdminUsersClient({ currentUserId, initialData }: AdminUsersClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [users, setUsers] = useState<AdminUser[]>(initialData.documents);
    const [total, setTotal] = useState<number>(initialData.total);
    const [error, setError] = useState<string | null>(null);

    const search = searchParams.get("search") ?? "";
    const role = searchParams.get("role") ?? "all";
    const sort = searchParams.get("sort") ?? "$createdAt-desc";
    const page = Number(searchParams.get("page") ?? 1);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ search, role, sort, page: String(page), limit: String(PAGE_LIMIT) });
        fetch(`/api/admin/users?${params.toString()}`, { signal: controller.signal })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || "Failed to load users.");
                const data = json.data as AdminUserListResponse;
                setUsers(data.documents);
                setTotal(data.total);
                setError(null);
            })
            .catch((err) => {
                if (err.name === "AbortError") return;
                setError(err.message || "Failed to load users.");
            });
        return () => controller.abort();
    }, [search, role, sort, page]);

    const updateParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams.toString());
        if (!value || value === "all" || value === "$createdAt-desc") {
            next.delete(key);
        } else {
            next.set(key, value);
        }
        if (key !== "page") next.delete("page");
        startTransition(() => {
            router.replace(next.toString() ? `?${next.toString()}` : "?");
        });
    };

    const handlePageChange = (nextPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextPage <= 1) params.delete("page");
        else params.set("page", String(nextPage));
        router.replace(params.toString() ? `?${params.toString()}` : "?");
    };

    const handleUserUpdated = (updated: AdminUser) => {
        setUsers((prev) => prev.map((u) => (u.$id === updated.$id ? updated : u)));
    };

    const handleUserDeleted = (id: string) => {
        setUsers((prev) => prev.filter((u) => u.$id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
    };

    const handleUserCreated = (created: AdminUser) => {
        setUsers((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
    };

    const roleLabel = useMemo(() => ROLE_OPTIONS.find((r) => r.value === role)?.label ?? "All roles", [role]);

    return (
        <div className="flex flex-col gap-5" data-testid="admin-users-page">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <AdminSearchBar placeholder="Search by name, email or username..." paramName="search" className="sm:max-w-md" />
                    <div className="flex items-center gap-2">
                        <Filter className="size-4 text-light-400" />
                        <Select value={role} onValueChange={(v) => updateParam("role", v)}>
                            <SelectTrigger className="h-11 min-w-[160px] rounded-xl border-light-300 bg-white">
                                <SelectValue placeholder={roleLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
                            <SelectTrigger className="h-11 min-w-[170px] rounded-xl border-light-300 bg-white">
                                <SelectValue placeholder="Sort" />
                                <ChevronDown className="size-4 text-light-400" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <AdminCreateUserDialog onCreated={handleUserCreated} />
            </div>

            {error && (
                <div className="rounded-2xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red" role="alert">
                    {error}
                </div>
            )}

            <div className="admin-table-wrapper">
                <table className="admin-table" data-testid="admin-users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th className="hidden md:table-cell">Files</th>
                            <th className="hidden lg:table-cell">Storage</th>
                            <th className="hidden md:table-cell">Joined</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((u) => (
                                <AdminUserRow
                                    key={u.$id}
                                    user={u}
                                    isSelf={u.$id === currentUserId}
                                    onUpdated={handleUserUpdated}
                                    onDeleted={handleUserDeleted}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-0">
                                    <EmptyState
                                        title={search || role !== "all" ? "No matching users" : "No users yet"}
                                        description={
                                            search || role !== "all"
                                                ? "Try clearing filters to see more results."
                                                : "Create your first user to get started."
                                        }
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AdminPagination page={page} total={total} limit={PAGE_LIMIT} onPageChange={handlePageChange} />

            {isPending && <p className="text-center text-xs text-light-400">Updating list…</p>}

            {users.length === 0 && (search || role !== "all") && (
                <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => { updateParam("role", "all"); updateParam("search", ""); }}>
                        Clear filters
                    </Button>
                </div>
            )}
        </div>
    );
}
