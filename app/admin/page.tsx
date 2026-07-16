import Link from "next/link";
import { Flag, Users, FileText, CreditCard, BrainCircuit, BookOpen } from "lucide-react";
import { getSystemStats, getAdminReports } from "@/lib/actions/admin.actions";
import StatsCard from "@/components/admin/StatsCard";
import EmptyState from "@/components/admin/EmptyState";
import FormattedDateTime from "@/components/FormattedDateTime";
import type { AdminReport } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const [statsResult, reportsResult] = await Promise.allSettled([
        getSystemStats(),
        getAdminReports({ limit: 5, sort: "$createdAt-desc" }),
    ]);

    const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
    const recentReports: AdminReport[] =
        reportsResult.status === "fulfilled" ? reportsResult.value.documents.slice(0, 5) : [];

    return (
        <div className="flex flex-col gap-6" data-testid="admin-dashboard">
            {/* Top stats grid - using data from /api/Admin/dashboard */}
            <div className="admin-stats-grid">
                <StatsCard
                    label="Total Users"
                    value={stats?.totalUsers ?? 0}
                    icon={Users}
                    description="Registered accounts on the platform"
                />
                <StatsCard
                    label="Total Documents"
                    value={stats?.totalDocuments ?? 0}
                    icon={FileText}
                    description="All documents uploaded to the platform"
                />
                <StatsCard
                    label="Total Reports"
                    value={stats?.totalReports ?? 0}
                    icon={Flag}
                    description="Documents flagged for moderator review"
                />
                <StatsCard
                    label="Pending Payments"
                    value={stats?.pendingPayments ?? 0}
                    icon={CreditCard}
                    description="Payments awaiting approval"
                />
            </div>

            {/* Secondary stats */}
            <div className="admin-stats-grid">
                <StatsCard
                    label="Completed Payments"
                    value={stats?.completedPayments ?? 0}
                    icon={CreditCard}
                    description="Approved payment transactions"
                />
                <StatsCard
                    label="Total Flashcards"
                    value={stats?.totalFlashcards ?? 0}
                    icon={BrainCircuit}
                    description="Flashcards created by users"
                />
                <StatsCard
                    label="Total Quizzes"
                    value={stats?.totalQuizzes ?? 0}
                    icon={BookOpen}
                    description="Quizzes taken by users"
                />
            </div>

            {/* Recent reports — purpose-built view for moderators */}
            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">Recent reports</h2>
                        <p className="admin-card-subtitle">
                            Latest 5 reports submitted by users
                        </p>
                    </div>
                    <Link
                        href="/admin/reports"
                        className="text-xs font-semibold text-brand hover:underline"
                    >
                        View all
                    </Link>
                </div>
                {recentReports.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                        {recentReports.map((r) => {
                            const reporter = r.reporterName ?? r.reporterEmail ?? "Unknown";
                            const document = r.documentTitle ?? r.documentFileName ?? `Document ${r.documentId}`;
                            const status = (r.status ?? "pending").toString();
                            const badgeClass =
                                status === "resolved"
                                    ? "admin-badge-success"
                                    : status === "rejected"
                                        ? "admin-badge-danger"
                                        : status === "reviewed"
                                            ? "admin-badge-info"
                                            : "admin-badge-warning";
                            return (
                                <li
                                    key={r.id ?? r.$id}
                                    className="flex items-start justify-between gap-3 rounded-xl border border-light-300 bg-light-300/30 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-dark-100">
                                            {reporter}
                                        </p>
                                        <p className="truncate text-xs text-light-400">
                                            Reported: {document}
                                        </p>
                                        {r.reason ? (
                                            <p className="mt-1 line-clamp-2 text-xs text-light-100">
                                                {r.reason}
                                            </p>
                                        ) : null}
                                        <p className="mt-1 text-[11px] text-light-400">
                                            <FormattedDateTime date={r.createdAt} />
                                        </p>
                                    </div>
                                    <span className={`admin-badge ${badgeClass}`}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </span>
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
