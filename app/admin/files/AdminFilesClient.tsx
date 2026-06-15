"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import AdminFileRow from "@/components/admin/AdminFileRow";
import AdminPagination from "@/components/admin/AdminPagination";
import EmptyState from "@/components/admin/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminFile, AdminFileListResponse } from "@/types/admin";

const TYPE_OPTIONS = [
    { value: "all", label: "All types" },
    { value: "document", label: "Documents" },
    { value: "image", label: "Images" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
    { value: "$createdAt-desc", label: "Newest first" },
    { value: "$createdAt-asc", label: "Oldest first" },
    { value: "name-asc", label: "Name A→Z" },
    { value: "name-desc", label: "Name Z→A" },
    { value: "size-desc", label: "Largest first" },
    { value: "size-asc", label: "Smallest first" },
];

const PAGE_LIMIT = 20;

interface AdminFilesClientProps {
    initialData: AdminFileListResponse;
}

export default function AdminFilesClient({ initialData }: AdminFilesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [files, setFiles] = useState<AdminFile[]>(initialData.documents);
    const [total, setTotal] = useState<number>(initialData.total);
    const [error, setError] = useState<string | null>(null);

    const search = searchParams.get("search") ?? "";
    const type = searchParams.get("type") ?? "all";
    const sort = searchParams.get("sort") ?? "$createdAt-desc";
    const page = Number(searchParams.get("page") ?? 1);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ search, type, sort, page: String(page), limit: String(PAGE_LIMIT) });
        fetch(`/api/admin/files?${params.toString()}`, { signal: controller.signal })
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
    }, [search, type, sort, page]);

    const updateParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams.toString());
        if (!value || value === "all" || value === "$createdAt-desc") {
            next.delete(key);
        } else {
            next.set(key, value);
        }
        if (key !== "page") next.delete("page");
        router.replace(next.toString() ? `?${next.toString()}` : "?");
    };

    const handlePageChange = (nextPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextPage <= 1) params.delete("page");
        else params.set("page", String(nextPage));
        router.replace(params.toString() ? `?${params.toString()}` : "?");
    };

    const handleFileDeleted = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.$id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
    };

    return (
        <div className="flex flex-col gap-5" data-testid="admin-files-page">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <AdminSearchBar placeholder="Search file names..." paramName="search" className="sm:max-w-md" />
                <div className="flex items-center gap-2">
                    <Filter className="size-4 text-light-400" />
                    <Select value={type} onValueChange={(v) => updateParam("type", v)}>
                        <SelectTrigger className="h-11 min-w-[150px] rounded-xl border-light-300 bg-white">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            {TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
                        <SelectTrigger className="h-11 min-w-[160px] rounded-xl border-light-300 bg-white">
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
                <table className="admin-table" data-testid="admin-files-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th className="hidden md:table-cell">Size</th>
                            <th className="hidden lg:table-cell">Owner</th>
                            <th className="hidden md:table-cell">Uploaded</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.length > 0 ? (
                            files.map((f) => <AdminFileRow key={f.$id} file={f} onDeleted={handleFileDeleted} />)
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-0">
                                    <EmptyState
                                        title={search || type !== "all" ? "No matching files" : "No files uploaded"}
                                        description={
                                            search || type !== "all"
                                                ? "Try a different search term or clear the filters."
                                                : "When users upload files, they will appear here."
                                        }
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AdminPagination page={page} total={total} limit={PAGE_LIMIT} onPageChange={handlePageChange} />
        </div>
    );
}
