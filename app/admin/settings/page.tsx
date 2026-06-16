import { CheckCircle2, Database, HardDrive, KeyRound, Server, Shield } from "lucide-react";
import { getAdminEmails } from "@/lib/admin/roles";
import { getSystemStats } from "@/lib/actions/admin.actions";
import { convertFileSize } from "@/lib/utils";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getUserRole } from "@/lib/admin/roles";

export const metadata = {
    title: "Settings · Admin",
};

export default async function AdminSettingsPage() {
    const [stats, currentUser] = await Promise.all([
        getSystemStats().catch(() => null),
        getCurrentUser(),
    ]);
    const adminEmails = getAdminEmails();
    const currentRole = getUserRole(currentUser);

    const envRows: Array<{ label: string; value: string; present: boolean }> = [
        { label: "DATABASE_URL", value: maskUrl(process.env.DATABASE_URL), present: Boolean(process.env.DATABASE_URL) },
        { label: "MINIO_ENDPOINT", value: process.env.MINIO_ENDPOINT || "(not set)", present: Boolean(process.env.MINIO_ENDPOINT) },
        { label: "MINIO_BUCKET_NAME", value: process.env.MINIO_BUCKET_NAME || "(default: smartstore-files)", present: Boolean(process.env.MINIO_BUCKET_NAME) },
        { label: "NEXT_PUBLIC_APPWRITE_ENDPOINT", value: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "(not set, using local storage)", present: Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) },
        { label: "ADMIN_EMAILS", value: process.env.ADMIN_EMAILS || "(no admins bootstrapped)", present: Boolean(process.env.ADMIN_EMAILS) },
    ];

    return (
        <div className="flex flex-col gap-6" data-testid="admin-settings-page">
            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">Current session</h2>
                        <p className="admin-card-subtitle">The account that has access to this console</p>
                    </div>
                    <span className={`admin-badge ${currentRole === "admin" ? "admin-badge-admin" : "admin-badge-user"}`}>
                        {currentRole.toUpperCase()}
                    </span>
                </div>
                {currentUser ? (
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DetailRow label="Name" value={currentUser.fullName} />
                        <DetailRow label="Email" value={currentUser.email} />
                        <DetailRow label="Username" value={currentUser.username} />
                        <DetailRow label="Account ID" value={currentUser.accountId} />
                    </dl>
                ) : (
                    <p className="text-sm text-light-400">No active session.</p>
                )}
            </section>

            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">Storage configuration</h2>
                        <p className="admin-card-subtitle">Environment variables and infrastructure status</p>
                    </div>
                    <HardDrive className="size-5 text-light-400" />
                </div>
                <ul className="flex flex-col gap-2">
                    {envRows.map((row) => (
                        <li key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-light-300/30 px-4 py-3 text-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                {row.present ? <CheckCircle2 className="size-4 text-emerald-600" /> : <KeyRound className="size-4 text-amber-600" />}
                                <span className="font-mono text-xs font-semibold text-dark-100">{row.label}</span>
                            </div>
                            <span className="truncate text-xs text-light-400">{row.value}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">Quick stats</h2>
                        <p className="admin-card-subtitle">Synced with the dashboard</p>
                    </div>
                    <Database className="size-5 text-light-400" />
                </div>
                {stats ? (
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <DetailRow label="Total users" value={String(stats.totalUsers)} />
                        <DetailRow label="Admins" value={String(stats.totalAdmins)} />
                        <DetailRow label="Total files" value={String(stats.totalFiles)} />
                        <DetailRow label="Storage used" value={convertFileSize(stats.totalStorage)} />
                    </dl>
                ) : (
                    <p className="text-sm text-light-400">Database is unreachable.</p>
                )}
            </section>

            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">Bootstrap admins</h2>
                        <p className="admin-card-subtitle">
                            Emails in the <code className="rounded bg-light-300/40 px-1 py-0.5 text-xs">ADMIN_EMAILS</code> environment
                            variable are promoted to the admin role on sign-up.
                        </p>
                    </div>
                    <Shield className="size-5 text-light-400" />
                </div>
                {adminEmails.length === 0 ? (
                    <EmptyHelper />
                ) : (
                    <ul className="flex flex-col gap-2">
                        {adminEmails.map((email) => (
                            <li key={email} className="flex items-center justify-between rounded-xl bg-brand/5 px-4 py-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <Shield className="size-4 text-brand" />
                                    <span className="font-mono text-xs text-dark-100">{email}</span>
                                </div>
                                <span className="admin-badge admin-badge-admin">Admin</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">About</h2>
                        <p className="admin-card-subtitle">Admin module version & tech stack</p>
                    </div>
                    <Server className="size-5 text-light-400" />
                </div>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailRow label="Admin module" value="v0.1.0" />
                    <DetailRow label="Framework" value="Next.js 16 (App Router)" />
                    <DetailRow label="UI" value="TailwindCSS 4 + shadcn-style components" />
                    <DetailRow label="Forms" value="react-hook-form + zod" />
                    <DetailRow label="Database" value="PostgreSQL" />
                    <DetailRow label="Storage" value="MinIO / S3 (or Appwrite)" />
                </ul>
            </section>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col rounded-xl bg-light-300/30 px-4 py-3">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-dark-100">{value}</dd>
        </div>
    );
}

function EmptyHelper() {
    return (
        <div className="rounded-xl border border-dashed border-light-300 bg-light-300/30 p-4 text-sm text-light-400">
            <p>
                Add a comma-separated list of admin emails to your <code className="font-mono text-xs">.env</code>:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-dark-100 p-3 text-xs text-light-700">
{`ADMIN_EMAILS=you@example.com,cofounder@example.com`}
            </pre>
        </div>
    );
}

function maskUrl(url: string | undefined): string {
    if (!url) return "(not set)";
    try {
        const parsed = new URL(url);
        if (parsed.password) parsed.password = "••••••";
        return parsed.toString();
    } catch {
        return "(set)";
    }
}
