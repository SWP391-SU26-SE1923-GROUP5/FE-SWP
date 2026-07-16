import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type IconVariant = "emerald" | "violet" | "blue" | "amber" | "rose";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    iconClassName?: string;
    description?: string;
    trend?: { value: number; positive: boolean; label?: string };
    variant?: IconVariant;
    className?: string;
}

const iconVariantClass: Record<IconVariant, string> = {
    emerald: "",
    violet: "admin-stats-icon-violet",
    blue: "admin-stats-icon-blue",
    amber: "admin-stats-icon-amber",
    rose: "admin-stats-icon-rose",
};

export default function StatsCard({
    label,
    value,
    icon: Icon,
    iconClassName,
    description,
    trend,
    variant = "emerald",
    className,
}: StatsCardProps) {
    const formattedValue = typeof value === "number" ? value.toLocaleString() : value;

    return (
        <div className={cn("admin-stats-card", className)} data-testid="stats-card">
            <div className={cn("admin-stats-icon", iconVariantClass[variant], iconClassName)}>
                <Icon className="size-6" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="admin-stats-label">{label}</p>
                <p className="admin-stats-value truncate" data-testid="stats-card-value">
                    {formattedValue}
                </p>
                {description && (
                    <p className="admin-stats-description truncate">{description}</p>
                )}
                {trend && (
                    <span
                        className={cn(
                            "admin-stats-trend",
                            trend.positive
                                ? "admin-stats-trend-positive"
                                : trend.value === 0
                                    ? "admin-stats-trend-neutral"
                                    : "admin-stats-trend-negative",
                        )}
                    >
                        {trend.value === 0 ? (
                            <Minus className="size-3" strokeWidth={3} />
                        ) : trend.positive ? (
                            <ArrowUpRight className="size-3" strokeWidth={3} />
                        ) : (
                            <ArrowDownRight className="size-3" strokeWidth={3} />
                        )}
                        {Math.abs(trend.value).toFixed(1)}%
                        {trend.label && (
                            <span className="ml-1 font-medium opacity-70">{trend.label}</span>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}
