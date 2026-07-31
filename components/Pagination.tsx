"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    total?: number;
    onPageChange?: (newPage: number) => void;
    itemsPerPage?: number;
    onItemsPerPageChange?: (newLimit: number) => void;
    itemName?: string;
}

const Pagination = ({
    page,
    totalPages,
    total,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    itemName
}: PaginationProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    if (totalPages <= 1 && total === undefined) return null;

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        if (onPageChange) {
            onPageChange(newPage);
        } else {
            const params = new URLSearchParams(searchParams?.toString() || "");
            params.set("page", newPage.toString());
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    const handleLimitChange = (newLimit: number) => {
        if (onItemsPerPageChange) {
            onItemsPerPageChange(newLimit);
        } else {
            const params = new URLSearchParams(searchParams?.toString() || "");
            params.set("limit", newLimit.toString());
            params.set("page", "1"); // Reset to page 1 on limit change
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    const currentLimit = itemsPerPage || Number(searchParams?.get("limit")) || 12;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full mt-8 pt-5 border-t border-slate-200/80 dark:border-slate-800">
            {/* Left: Item count & summary */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>
                    {total !== undefined
                        ? `Showing ${Math.min((page - 1) * currentLimit + 1, total)} - ${Math.min(page * currentLimit, total)} of ${total} ${itemName || 'documents'}`
                        : `Page ${page} of ${totalPages || 1}`}
                </span>

                {(onItemsPerPageChange || !onPageChange) && (
                    <div className="flex items-center gap-1.5 pl-4 border-l border-slate-200 dark:border-slate-800">
                        <span>Per page:</span>
                        <select
                            value={currentLimit}
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand cursor-pointer"
                        >
                            <option value={6}>6</option>
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Right: Page Navigation Controls */}
            <div className="flex items-center gap-1.5">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="h-8 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                </Button>

                <div className="flex items-center px-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                        {page} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {totalPages || 1}</span>
                    </span>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="h-8 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
