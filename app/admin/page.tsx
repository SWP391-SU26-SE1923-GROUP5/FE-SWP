import Link from "next/link";
import {
    CreditCard,
    FileText,
    Flag,
    Folder,
    HardDrive,
    HelpCircle,
    Shield,
    Users,
} from "lucide-react";
import { getSystemStats, getAdminUsers, getAdminFiles, getAdminReports } from "@/lib/actions/admin.actions";
import StatsCard from "@/components/admin/StatsCard";
import EmptyState from "@/components/admin/EmptyState";
import FormattedDateTime from "@/components/FormattedDateTime";
import Thumbnail from "@/components/Thumbnail";
import { convertFileSize } from "@/lib/utils";
import type { AdminDashboard, AdminFile, AdminReport, AdminUser } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const fallback: AdminDashboard = {
        totalUsers: 0,
        totalDocuments: 0,
        totalPayments: 0,
        pendingPayments: 0,
        completedPayments: 0,
        totalReports: 0,
        totalFlashcards: 0,
        totalQuizzes: 0,
        generatedAt: new Date().toISOString(),
    };

    const [statsResult, usersResult, filesResult, reportsResult] = await Promise.allSettled([
        getSystemStats(),
        getAdminUsers({limit: 5, sort: "$createdAt-desc"}),
        getAdminFiles({limit: 5, sort: "$createdAt-desc"}),
        getAdminReports({limit: 5, sort: "$createdAt-desc"}),
    ]);

    const stats = statsResult.status === "fulfilled" ? statsResult.value : fallback;
    const recentUsers: AdminUser[] = usersResult.status === "fulfilled" ? usersResult.value.documents.slice(0, 5) : [];
    const recentFiles: AdminFile[] = filesResult.status === "fulfilled" ? filesResult.value.documents.slice(0, 5) : [];
    const recentReports: AdminReport[] =
        reportsResult.status === "fulfilled" ? reportsResult.value.documents.slice(0, 5) : [];

    return (
        <div className="flex flex-col gap-6" data-testid="admin-dashboard">
            <div className="admin-stats-grid">
                <StatsCard
                    label="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    description="Registered accounts"
                />
                <StatsCard
                    label="Documents"
                    value={stats.totalDocuments}
                    icon={FileText}
                    description="Across all users"
                />
                <StatsCard
                    label="Reports"
                    value={stats.totalReports}
                    icon={Flag}
                    description="Pending moderator review"
                />
                <StatsCard
                    label="Quizzes / Flashcards"
                    value={`${stats.totalQuizzes} / ${stats.totalFlashcards}`}
                    icon={HelpCircle}
                    description="AI-generated learning content"
                />
            </div>

            <div className="admin-stats-grid">
                <StatsCard
                    label="Payments"
                    value={stats.totalPayments}
                    icon={CreditCard}
                    description={`${stats.completedPayments} completed · ${stats.pendingPayments} pending`}
                />
                <StatsCard
                    label="Storage"
                    value="Tracked per user"
                    icon={HardDrive}
                    description="See the Users page for per-account usage"
                />
                <StatsCard
                    label="Admins"
                    value="Set in ADMIN_EMAILS"
                    icon={Shield}
                    description="Privileged accounts bootstrap from the env"
                />
                <StatsCard
                    label="Generated at"
                    value={new Date(stats.generatedAt).toLocaleString()}
                    icon={HelpCircle}
                    description="Live snapshot from the AIStudyHub API"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <section className="admin-card xl:col-span-2">
                    <div className="admin-card-header">
                        <div>
                            <h2 className="admin-card-title">Recent documents</h2>
                            <p className="admin-card-subtitle">Latest 5 uploads across the platform</p>
                        </div>
                        <Link href="/admin/files" className="text-xs font-semibold text-brand hover:underline">
                            View all
                        </Link>
                    </div>
                    {recentFiles.length > 0 ? (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Owner</th>
                                        <th>Type</th>
                                        <th>Uploaded</th>
                                    </tr>
                                </thead>
                                <tbody>
                                                    {recentFiles.map((file) => {
                                                        const fileId = file.id ?? file.$id ?? "";
                                                        const type = file.type ?? "document";
                                                        const extension = file.fileExtension ?? file.extension ?? "file";
                                                        const name = file.title ?? file.name ?? "Untitled";
                                                        const url = file.fileLink ?? file.url ?? "";
                                                        return (
                                            <tr key={fileId}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <Thumbnail
                                                            type={type}
                                                            extension={extension}
                                                            url={url}
                                                            className="!size-8"
                                                            imageClassName="!size-5"
                                                        />
                                                        <p className="truncate text-sm text-dark-100">{name}</p>
                                                    </div>
                                                </td>
                                                <td className="text-sm text-light-100">{file.ownerName ?? "—"}</td>
                                                <td>
                                                    <span className="admin-badge admin-badge-user capitalize">
                                                        {type}
                                                    </span>
                                                </td>
                                                <td className="text-xs text-light-400">
                                                    <FormattedDateTime date={file.createdAt} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            title="No documents yet"
                            description="When users upload documents they will appear here."
                            icon={Folder}
                        />
                    )}
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <div>
                            <h2 className="admin-card-title">Recent users</h2>
                            <p className="admin-card-subtitle">Latest 5 sign-ups</p>
                        </div>
                        <Link href="/admin/users" className="text-xs font-semibold text-brand hover:underline">
                            View all
                        </Link>
                    </div>
                    {recentUsers.length > 0 ? (
                        <ul className="flex flex-col gap-3">
                            {recentUsers.map((u) => (
                                <li key={u.id ?? u.$id} className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-dark-100">{u.fullName}</p>
                                        <p className="truncate text-xs text-light-400">{u.email}</p>
                                    </div>
                                    <span
                                        className={`admin-badge ${
                                            u.role === "admin" ? "admin-badge-admin" : "admin-badge-user"
                                        }`}
                                    >
                                        {u.role}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No users yet" description="When users sign up they will appear here." icon={Users} />
                    )}
                </section>
            </div>

            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">Recent reports</h2>
                        <p className="admin-card-subtitle">Latest 5 reports submitted by users</p>
                    </div>
                    <Link href="/admin/reports" className="text-xs font-semibold text-brand hover:underline">
                        View all
                    </Link>
                </div>
                {recentReports.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                        {recentReports.map((r) => {
                            const reporter = r.reporterName ?? r.reporterEmail ?? "Unknown";
                            const document = r.documentTitle ?? r.documentFileName ?? `Document ${r.documentId}`;
                            return (
                                <li
                                    key={r.id ?? r.$id}
                                    className="flex items-start justify-between gap-3 rounded-xl border border-light-300 bg-light-300/30 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-dark-100">{reporter}</p>
                                        <p className="truncate text-xs text-light-400">Reported: {document}</p>
                                        {r.reason ? (
                                            <p className="mt-1 line-clamp-2 text-xs text-light-100">{r.reason}</p>
                                        ) : null}
                                    </div>
                                    <span className="admin-badge admin-badge-warning">Pending</span>
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
