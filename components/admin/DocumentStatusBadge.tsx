import { cn } from "@/lib/utils";

export type DocumentModerationStatus = "active" | "hidden" | "removed";

interface DocumentStatusBadgeProps {
    status: DocumentModerationStatus;
    className?: string;
}

const STATUS_STYLES: Record<DocumentModerationStatus, string> = {
    active: "admin-badge-success",
    hidden: "admin-badge-warning",
    removed: "admin-badge-danger",
};

const STATUS_LABELS: Record<DocumentModerationStatus, string> = {
    active: "Active",
    hidden: "Hidden",
    removed: "Removed",
};

export default function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
    return (
        <span className={cn("admin-badge", STATUS_STYLES[status], className)} data-document-status={status}>
            {STATUS_LABELS[status]}
        </span>
    );
}