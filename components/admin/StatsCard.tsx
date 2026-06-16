import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    iconClassName?: string;
    description?: string;
    trend?: { value: number; positive: boolean };
    className?: string;
}

export default function StatsCard({
    label,
    value,
    icon: Icon,
    iconClassName,
    description,
    trend,
    className,
}: StatsCardProps) {
    return (
        <div className={cn("admin-stats-card", className)} data-testid="stats-card">
            <div className={cn("admin-stats-icon", iconClassName)}>
                <Icon className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="admin-stats-label">{label}</p>
                <p className="admin-stats-value truncate" data-testid="stats-card-value">{value}</p>
                {description && <p className="mt-0.5 text-xs text-light-400 truncate">{description}</p>}
                {trend && (
                    <p className={cn("mt-1 text-xs font-semibold", trend.positive ? "text-emerald-600" : "text-red")}>
                        {trend.positive ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}%
                    </p>
                )}
            </div>
        </div>
    );
}
