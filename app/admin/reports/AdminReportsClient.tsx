"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Flag } from "lucide-react";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminViolationRow, { type AdminViolationRowData } from "@/components/admin/AdminViolationRow";
import EmptyState from "@/components/admin/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ViolationStatus } from "@/components/admin/ViolationStatusBadge";
import type { AdminReport } from "@/types/admin";

const STATUS_OPTIONS: { value: "all" | ViolationStatus; label: string }[] = [
    {value: "all", label: "All statuses"},
    {value: "pending", label: "Pending"},
    {value: "reviewed", label: "Reviewed"},
    {value: "resolved", label: "Resolved"},
    {value: "rejected", label: "Rejected"},
];

const SORT_OPTIONS = [
    {value: "$createdAt-desc", label: "Newest first"},
    {value: "$createdAt-asc", label: "Oldest first"},
    {value: "status-asc", label: "Status A→Z"},
];

const PAGE_LIMIT = 20;

const mapReportToRow = (r: AdminReport): AdminViolationRowData => {
    const fallbackStatus: ViolationStatus = "pending";
    return {
        $id: r.id ?? r.$id ?? "",
        reporterName: r.reporterName ?? r.reporterEmail ?? "Unknown",
        reporterEmail: r.reporterEmail ?? "",
        documentId: r.documentId,
        documentName: r.documentTitle ?? r.documentFileName ?? r.documentName ?? `Document ${r.documentId}`,
        reason: r.reason ?? "",
        status: (r.status as ViolationStatus | undefined) ?? fallbackStatus,
        createdAt: r.createdAt,
    };
};

export default function AdminReportsClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [items, setItems] = useState<AdminViolationRowData[]>([]);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const search = searchParams.get("search") ?? "";
    const status = (searchParams.get("status") as "all" | ViolationStatus) ?? "all";
    const sort = searchParams.get("sort") ?? "$createdAt-desc";
    const page = Number(searchParams.get("page") ?? 1);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({search, sort, page: String(page), limit: String(PAGE_LIMIT)});
        if (status && status !== "all") {
            params.set("status", status);
        }
        fetch(`/api/admin/reports?${params.toString()}`, {signal: controller.signal})
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || "Failed to load reports.");
                const documents: AdminReport[] = json.data?.documents ?? [];
                setItems(documents.map(mapReportToRow));
                setTotal(json.data?.total ?? documents.length);
                setError(null);
            })
            .catch((err) => {
                if (err.name === "AbortError") return;
                setError(err.message || "Failed to load reports.");
            });
        return () => controller.abort();
    }, [search, status, sort, page]);

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

    return (
        <div className="flex flex-col gap-5" data-testid="admin-reports-page">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <AdminSearchBar
                        placeholder="Search by reporter or document..."
                        paramName="search"
                        className="sm:max-w-md"
                    />
                    <div className="flex items-center gap-2">
                        <Filter className="size-4 text-light-400" />
                        <Select value={status} onValueChange={(v) => updateParam("status", v)}>
                            <SelectTrigger className="h-11 min-w-[160px] rounded-xl border-light-300 bg-white">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
                            <SelectTrigger className="h-11 min-w-[170px] rounded-xl border-light-300 bg-white">
                                <SelectValue placeholder="Sort" />
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
            </div>

            {error && (
                <div className="rounded-2xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red" role="alert">
                    {error}
                </div>
            )}

            <div className="admin-table-wrapper">
                <table className="admin-table" data-testid="admin-reports-table">
                    <thead>
                        <tr>
                            <th>Reporter</th>
                            <th>Document</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th className="hidden md:table-cell">Submitted</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map((v) => <AdminViolationRow key={v.$id} violation={v} />)
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-0">
                                    <EmptyState
                                        icon={Flag}
                                        title={
                                            search || status !== "all"
                                                ? "No matching reports"
                                                : "No reports in this workspace"
                                        }
                                        description={
                                            search || status !== "all"
                                                ? "Try clearing filters to see more results."
                                                : "Once users submit violation reports through the user app, they will appear here for review."
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
        </div>
    );
}
