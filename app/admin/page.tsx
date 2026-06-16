import Link from "next/link";
import { FileText, Folder, HardDrive, Shield, Users } from "lucide-react";
import { getSystemStats } from "@/lib/actions/admin.actions";
import StatsCard from "@/components/admin/StatsCard";
import EmptyState from "@/components/admin/EmptyState";
import FormattedDateTime from "@/components/FormattedDateTime";
import Thumbnail from "@/components/Thumbnail";
import { convertFileSize, formatDateTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
    let stats;
    try {
        stats = await getSystemStats();
    } catch (error) {
        console.error("Failed to load admin stats", error);
        stats = null;
    }

    return (
        <div className="flex flex-col gap-6" data-testid="admin-dashboard">
            <div className="admin-stats-grid">
                <StatsCard
                    label="Total Users"
                    value={stats?.totalUsers ?? 0}
                    icon={Users}
                    description={`${stats?.totalAdmins ?? 0} admins`}
                />
                <StatsCard
                    label="Files Stored"
                    value={stats?.totalFiles ?? 0}
                    icon={FileText}
                    description="Across all users"
                />
                <StatsCard
                    label="Storage Used"
                    value={convertFileSize(stats?.totalStorage ?? 0)}
                    icon={HardDrive}
                    description="Cumulative"
                />
                <StatsCard
                    label="Admins"
                    value={stats?.totalAdmins ?? 0}
                    icon={Shield}
                    description="Privileged accounts"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <section className="admin-card xl:col-span-2">
                    <div className="admin-card-header">
                        <div>
                            <h2 className="admin-card-title">Storage breakdown</h2>
                            <p className="admin-card-subtitle">Bytes by file type</p>
                        </div>
                    </div>
                    {stats ? (
                        <StorageBars stats={stats.storageByType} total={stats.totalStorage} />
                    ) : (
                        <EmptyState title="Storage unavailable" description="Connect the database to view usage." icon={HardDrive} />
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
                    {stats && stats.recentUsers.length > 0 ? (
                        <ul className="flex flex-col gap-3">
                            {stats.recentUsers.map((u) => (
                                <li key={u.$id} className="flex items-center justify-between gap-3">
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
                        <h2 className="admin-card-title">Recent files</h2>
                        <p className="admin-card-subtitle">Latest 5 uploads across the platform</p>
                    </div>
                    <Link href="/admin/files" className="text-xs font-semibold text-brand hover:underline">
                        View all
                    </Link>
                </div>
                {stats && stats.recentFiles.length > 0 ? (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Owner</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Uploaded</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentFiles.map((f) => (
                                    <tr key={f.$id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <Thumbnail type={f.type} extension={f.extension} url={f.url} className="!size-8" imageClassName="!size-5" />
                                                <p className="truncate text-sm text-dark-100">{f.name}</p>
                                            </div>
                                        </td>
                                        <td className="text-sm text-light-100">{f.ownerName ?? "—"}</td>
                                        <td>
                                            <span className="admin-badge admin-badge-user capitalize">{f.type}</span>
                                        </td>
                                        <td className="text-sm text-light-100">{convertFileSize(f.size)}</td>
                                        <td className="text-xs text-light-400">
                                            <FormattedDateTime date={f.$createdAt} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState title="No files yet" description="Once files are uploaded they will appear here." icon={Folder} />
                )}
            </section>

            {stats && (
                <section className="admin-card">
                    <div className="admin-card-header">
                        <div>
                            <h2 className="admin-card-title">File activity (last 14 days)</h2>
                            <p className="admin-card-subtitle">Uploads grouped by day</p>
                        </div>
                    </div>
                    {stats.fileGrowth.length === 0 ? (
                        <p className="text-sm text-light-400">No uploads in the last 14 days.</p>
                    ) : (
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                            {stats.fileGrowth.map((point) => (
                                <li
                                    key={point.date}
                                    className="rounded-xl border border-light-300 bg-light-300/30 p-3 text-center"
                                >
                                    <p className="text-[10px] font-semibold uppercase text-light-400">{formatDateTime(point.date)}</p>
                                    <p className="mt-1 text-lg font-bold text-dark-100">{point.count}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </div>
    );
}

function StorageBars({ stats, total }: { stats: { document: number; image: number; video: number; audio: number; other: number }; total: number }) {
    const buckets: Array<{ key: keyof typeof stats; label: string }> = [
        { key: "document", label: "Documents" },
        { key: "image", label: "Images" },
        { key: "video", label: "Video" },
        { key: "audio", label: "Audio" },
        { key: "other", label: "Other" },
    ];

    if (total === 0) {
        return <p className="text-sm text-light-400">No storage used yet.</p>;
    }

    return (
        <ul className="flex flex-col gap-3">
            {buckets.map((b) => {
                const size = stats[b.key] ?? 0;
                const pct = total > 0 ? Math.round((size / total) * 100) : 0;
                return (
                    <li key={b.key} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-dark-100">{b.label}</span>
                            <span className="text-light-400">
                                {convertFileSize(size)} · {pct}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-light-300">
                            <div
                                className="h-full rounded-full bg-brand transition-all"
                                style={{ width: `${pct}%` }}
                                data-testid={`storage-bar-${b.key}`}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
