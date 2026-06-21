"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminDocumentViolationRow from "@/components/admin/AdminDocumentViolationRow";
import EmptyState from "@/components/admin/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AdminFile, AdminFileListResponse } from "@/types/admin";
import type { DocumentModerationStatus } from "@/components/admin/DocumentStatusBadge";

const STATUS_OPTIONS = [
    {value: "all", label: "All statuses"},
    {value: "active", label: "Active"},
    {value: "removed", label: "Banned"},
];

const SORT_OPTIONS = [
    {value: "$createdAt-desc", label: "Newest first"},
    {value: "$createdAt-asc", label: "Oldest first"},
    {value: "name-asc", label: "Name A→Z"},
    {value: "size-desc", label: "Largest first"},
];

const PAGE_LIMIT = 20;

interface AdminDocumentViolationsClientProps {
    initialData: AdminFileListResponse;
}

const isBannedStatus = (status: unknown): boolean => {
    if (typeof status !== "string") return false;
    const s = status.toLowerCase();
    return s === "banned" || s === "removed";
};

const fileToModerationStatus = (file: AdminFile): DocumentModerationStatus =>
    isBannedStatus(file.status) ? "removed" : "active";

export default function AdminDocumentViolationsClient({initialData}: AdminDocumentViolationsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [files, setFiles] = useState<AdminFile[]>(initialData.documents);
    const [total, setTotal] = useState<number>(initialData.total);
    const [error, setError] = useState<string | null>(null);

    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all";
    const sort = searchParams.get("sort") ?? "$createdAt-desc";
    const page = Number(searchParams.get("page") ?? 1);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({search, sort, page: String(page), limit: String(PAGE_LIMIT)});
        if (status && status !== "all") {
            params.set("status", status);
        }
        fetch(`/api/admin/files?${params.toString()}`, {signal: controller.signal})
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || "Failed to load files.");
                const data = json.data as AdminFileListResponse;
                setFiles(data.documents);
                setTotal(data.total);
                setError(null);
            })
            .catch((err) => {
                if (err.name === "AbortError") return;
                setError(err.message || "Failed to load files.");
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

    const handleModerationChange = (file: AdminFile) => {
        const fileId = file.id ?? file.$id ?? "";
        setFiles((prev) => prev.map((f) => ((f.id ?? f.$id ?? "") === fileId ? file : f)));
    };

    return (
        <div className="flex flex-col gap-5" data-testid="admin-document-violations-page">
            <div className="rounded-2xl border border-dashed border-light-300 bg-light-300/30 px-4 py-3 text-xs text-light-400">
                Document moderation uses the AIStudyHub <code className="rounded bg-light-300 px-1">Banned</code> status.
                Banning a document via this console calls
                <code className="mx-1 rounded bg-light-300 px-1">PUT /api/Admin/documents/{`{id}`}/ban</code>
                and reinstating calls
                <code className="mx-1 rounded bg-light-300 px-1">PUT /api/Document/{`{id}`}</code>
                to flip the status back to
                <code className="ml-1 rounded bg-light-300 px-1">Published</code>.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <AdminSearchBar
                    placeholder="Search documents..."
                    paramName="search"
                    className="sm:max-w-md"
                />
                <div className="flex items-center gap-2">
                    <Filter className="size-4 text-light-400" />
                    <Select value={status} onValueChange={(v) => updateParam("status", v)}>
                        <SelectTrigger className="h-11 min-w-[150px] rounded-xl border-light-300 bg-white">
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

            {error && (
                <div className="rounded-2xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red" role="alert">
                    {error}
                </div>
            )}

            <div className="admin-table-wrapper">
                <table className="admin-table" data-testid="admin-document-violations-table">
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th className="hidden md:table-cell">Owner</th>
                            <th className="hidden lg:table-cell">Reports</th>
                            <th className="hidden md:table-cell">Uploaded</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.length > 0 ? (
                            files.map((f) => (
                                <AdminDocumentViolationRow
                                    key={f.id ?? f.$id}
                                    file={f}
                                    status={fileToModerationStatus(f)}
                                    onModerationChange={handleModerationChange}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-0">
                                    <EmptyState
                                        title={
                                            search || status !== "all"
                                                ? "No matching documents"
                                                : "No documents to moderate"
                                        }
                                        description={
                                            search || status !== "all"
                                                ? "Try clearing filters to see more results."
                                                : "Documents uploaded by users will appear here for moderation."
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

            {files.length === 0 && (search || status !== "all") && (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            updateParam("status", "all");
                            updateParam("search", "");
                        }}
                    >
                        Clear filters
                    </Button>
                </div>
            )}
        </div>
    );
}
