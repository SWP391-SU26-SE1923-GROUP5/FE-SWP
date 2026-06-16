"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function AdminPagination({ page, total, limit, onPageChange, className }: AdminPaginationProps) {
    const pageCount = Math.max(1, Math.ceil(total / limit));
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(total, page * limit);
    const hasPrev = page > 1;
    const hasNext = page < pageCount;

    return (
        <div className={`admin-pagination ${className ?? ""}`} data-testid="pagination">
            <p className="admin-pagination-info">
                Showing <span className="font-semibold text-dark-100">{start}</span>–
                <span className="font-semibold text-dark-100">{end}</span> of{" "}
                <span className="font-semibold text-dark-100">{total}</span>
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="admin-pagination-button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrev}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="size-4" />
                    Previous
                </button>
                <span className="text-xs font-medium text-light-400">
                    Page {page} of {pageCount}
                </span>
                <button
                    type="button"
                    className="admin-pagination-button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNext}
                    aria-label="Next page"
                >
                    Next
                    <ChevronRight className="size-4" />
                </button>
            </div>
        </div>
    );
}
