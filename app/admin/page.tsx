import Link from "next/link";
import {
    ArrowRight,
    CalendarClock,
    Flag,
    ShieldCheck,
    Sparkles,
    Users,
} from "lucide-react";
import { getSystemStats, getAdminReports } from "@/lib/actions/admin.actions";
import StatsCard from "@/components/admin/StatsCard";
import EmptyState from "@/components/admin/EmptyState";
import FormattedDateTime from "@/components/FormattedDateTime";
import type { AdminReport, ReportStatus } from "@/types/admin";
import { getCurrentUser } from "@/lib/actions/user.actions";

export const dynamic = "force-dynamic";

type BadgeClass = "admin-badge-success" | "admin-badge-danger" | "admin-badge-info" | "admin-badge-warning";

const badgeForStatus = (status: string): BadgeClass => {
    switch (status) {
        case "resolved":
            return "admin-badge-success";
        case "rejected":
            return "admin-badge-danger";
        case "reviewed":
            return "admin-badge-info";
        default:
            return "admin-badge-warning";
    }
};

const initialsOf = (value: string | null | undefined): string => {
    if (!value) return "•";
    const cleaned = value.trim();
    if (!cleaned) return "•";
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return cleaned.slice(0, 1).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const avatarClassFor = (status: string): string => {
    switch (status) {
        case "resolved":
            return "admin-report-avatar";
        case "rejected":
            return "admin-report-avatar-rose";
        case "reviewed":
            return "admin-report-avatar-blue";
        default:
            return "admin-report-avatar-amber";
    }
};

const statusLabel = (status: string): string =>
    status.charAt(0).toUpperCase() + status.slice(1);

const deriveGreeting = (date: Date): string => {
    const hour = date.getHours();
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

export default async function AdminDashboardPage() {
    const [statsResult, reportsResult, currentUser] = await Promise.allSettled([
        getSystemStats(),
        getAdminReports({ limit: 5, sort: "$createdAt-desc" }),
        getCurrentUser(),
    ]);

    const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
    const recentReports: AdminReport[] =
        reportsResult.status === "fulfilled" ? reportsResult.value.documents.slice(0, 5) : [];

    const now = new Date();
    const greeting = deriveGreeting(now);
    const displayName =
        currentUser.status === "fulfilled" && currentUser.value?.fullName
            ? currentUser.value.fullName.split(" ").slice(-2).join(" ")
            : "Moderator";

    const pendingReports = recentReports.filter(
        (r) => (r.status ?? "pending") === ("pending" satisfies ReportStatus),
    ).length;

    return (
        <div className="admin-dashboard" data-testid="admin-dashboard">
            {/* Hero / welcome */}
            <section className="admin-hero" aria-labelledby="admin-hero-title">
                <div className="admin-hero-inner">
                    <div className="min-w-0">
                        <span className="admin-hero-eyebrow">
                            <span className="admin-hero-eyebrow-dot" aria-hidden />
                            Live moderation
                        </span>
                        <h1 id="admin-hero-title" className="admin-hero-title">
                            {greeting}, <span className="admin-hero-title-accent">{displayName}</span>
                        </h1>
                        <p className="admin-hero-subtitle">
                            Keep the community safe. Review pending reports, monitor user activity
                            and track platform growth — all in one place.
                        </p>
                    </div>
                    <div className="admin-hero-actions">
                        <Link
                            href="/admin/reports"
                            className="admin-hero-button admin-hero-button-primary"
                        >
                            <Flag className="size-4" strokeWidth={2.5} />
                            Review reports
                            <ArrowRight className="size-4" strokeWidth={2.5} />
                        </Link>
                        <Link
                            href="/admin/users"
                            className="admin-hero-button admin-hero-button-secondary"
                        >
                            <ShieldCheck className="size-4" strokeWidth={2.5} />
                            Manage users
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats grid */}
            <div className="admin-stats-grid" role="list">
                <StatsCard
                    label="Total Users"
                    value={stats?.totalUsers ?? 0}
                    icon={Users}
                    variant="emerald"
                    description="Registered accounts on the platform"
                />
                <StatsCard
                    label="Total Reports"
                    value={stats?.totalReports ?? 0}
                    icon={Flag}
                    variant="rose"
                    description="Documents flagged for moderator review"
                />
                <StatsCard
                    label="Pending review"
                    value={pendingReports}
                    icon={Sparkles}
                    variant="amber"
                    description="Newest reports awaiting your action"
                />
            </div>

            {/* Recent reports — purpose-built view for moderators */}
            <section className="admin-card" aria-labelledby="admin-recent-reports-title">
                <header className="admin-card-header">
                    <div className="admin-section-header">
                        <div>
                            <h2 id="admin-recent-reports-title" className="admin-section-title">
                                Recent reports
                            </h2>
                            <p className="admin-section-subtitle">
                                Latest {recentReports.length} report
                                {recentReports.length === 1 ? "" : "s"} submitted by users
                            </p>
                        </div>
                        <Link
                            href="/admin/reports"
                            className="admin-section-link"
                            aria-label="View all reports"
                        >
                            View all
                            <ArrowRight className="size-3.5" strokeWidth={2.5} />
                        </Link>
                    </div>
                </header>

                {recentReports.length > 0 ? (
                    <ul className="admin-report-list" role="list">
                        {recentReports.map((r) => {
                            const reporter =
                                r.reporterName ?? r.reporterEmail ?? "Unknown reporter";
                            const document =
                                r.documentTitle ?? r.documentFileName ?? `Document ${r.documentId}`;
                            const status = (r.status ?? "pending").toString();
                            const badgeClass = badgeForStatus(status);
                            const avatarClass = avatarClassFor(status);
                            return (
                                <li
                                    key={r.id ?? r.$id}
                                    className="admin-report-item"
                                >
                                    <div
                                        className={`admin-report-avatar ${avatarClass}`}
                                        aria-hidden
                                    >
                                        {initialsOf(reporter)}
                                    </div>
                                    <div className="admin-report-body">
                                        <div className="admin-report-row">
                                            <p className="admin-report-reporter" title={reporter}>
                                                {reporter}
                                            </p>
                                            <span className={`admin-badge ${badgeClass}`}>
                                                {statusLabel(status)}
                                            </span>
                                        </div>
                                        <p className="admin-report-meta">
                                            <FileText
                                                className="admin-report-meta-icon"
                                                strokeWidth={2.25}
                                                aria-hidden
                                            />
                                            <span className="admin-report-document" title={document}>
                                                {document}
                                            </span>
                                        </p>
                                        {r.reason ? (
                                            <p className="admin-report-reason">{r.reason}</p>
                                        ) : null}
                                        <p className="admin-report-timestamp">
                                            <CalendarClock className="size-3" strokeWidth={2.25} aria-hidden />
                                            <span className="admin-report-timestamp-dot" aria-hidden />
                                            <FormattedDateTime date={r.createdAt} />
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <EmptyState
                        title="No reports yet"
                        description="When users report content it will appear here for review."
                        icon={Flag}
                    />
                )}
            </section>
        </div>
    );
}
