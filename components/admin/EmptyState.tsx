import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    className?: string;
}

export default function EmptyState({
    title,
    description,
    icon: Icon = Inbox,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-light-300 bg-light-300/30 px-6 py-12 text-center",
                className,
            )}
            role="status"
            data-testid="empty-state"
        >
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100/70 to-white shadow-sm ring-1 ring-emerald-100">
                <Icon className="size-6 text-brand" strokeWidth={2.25} />
            </div>
            <h3 className="text-sm font-semibold text-dark-100">{title}</h3>
            {description && (
                <p className="max-w-sm text-xs leading-relaxed text-light-400">{description}</p>
            )}
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}
