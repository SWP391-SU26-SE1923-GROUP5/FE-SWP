import { cn } from "@/lib/utils";

export type ViolationStatus = "pending" | "reviewed" | "resolved" | "rejected";

interface ViolationStatusBadgeProps {
    status: ViolationStatus;
    className?: string;
}

const STATUS_STYLES: Record<ViolationStatus, string> = {
    pending: "admin-badge-warning",
    reviewed: "admin-badge-admin",
    resolved: "admin-badge-success",
    rejected: "admin-badge-danger",
};

const STATUS_LABELS: Record<ViolationStatus, string> = {
    pending: "Pending",
    reviewed: "Reviewed",
    resolved: "Resolved",
    rejected: "Rejected",
};

export default function ViolationStatusBadge({ status, className }: ViolationStatusBadgeProps) {
    return (
        <span className={cn("admin-badge", STATUS_STYLES[status], className)} data-status={status}>
            {STATUS_LABELS[status]}
        </span>
    );
}