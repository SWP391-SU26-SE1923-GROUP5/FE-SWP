import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: React.ReactNode;
    className?: string;
}

export default function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
    return (
        <div className={cn("admin-empty", className)} role="status" data-testid="empty-state">
            <div className="admin-empty-icon">
                <Icon className="size-6" />
            </div>
            <h3 className="admin-empty-title">{title}</h3>
            {description && <p className="admin-empty-text">{description}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
