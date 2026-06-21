import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Database, ShieldCheck, ShieldOff } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getAdminUserById, getAdminFiles, updateAdminUserTier } from "@/lib/actions/admin.actions";
import EmptyState from "@/components/admin/EmptyState";
import StatsCard from "@/components/admin/StatsCard";
import TierSwitcher from "@/components/admin/TierSwitcher";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 10;

interface AdminUserDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string }>;
}

export default async function AdminUserDetailPage({ params, searchParams }: AdminUserDetailPageProps) {
    const { id } = await params;
    const sp = (await searchParams) ?? {};
    const me = await getCurrentUser();
    if (!me) redirect("/sign-in");

    const user = await getAdminUserById(id);
    if (!user) notFound();

    const page = Math.max(1, Number(sp.page ?? 1));

    let userFiles: Awaited<ReturnType<typeof getAdminFiles>> = {documents: [], total: 0};
    try {
        userFiles = await getAdminFiles({
            search: "",
            type: "all",
            sort: "$createdAt-desc",
            page,
            limit: PAGE_LIMIT,
        });
    } catch {
        userFiles = {documents: [], total: 0};
    }

    const handleTierChange = async (tier: string) => {
        "use server";
        await updateAdminUserTier(id, tier);
    };

    const totalPages = Math.max(1, Math.ceil(userFiles.total / PAGE_LIMIT));
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    const createdAt = user.createdAt;
    const tier = user.tier ?? "Free";

    return (
        <div className="space-y-6" data-testid="admin-user-detail">
            <div>
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-light-400 hover:text-brand"
                >
                    <ArrowLeft className="size-3" /> Back to users
                </Link>
            </div>

            <div className="admin-stats-grid">
                <StatsCard
                    label="Subscription tier"
                    value={tier}
                    icon={Database}
                    description="Change the tier to gate features (Free / Premium)"
                />
                <StatsCard
                    label="Account role"
                    value={user.role === "admin" ? "Admin" : "User"}
                    icon={ShieldCheck}
                    description="Role is managed by the AIStudyHub backend"
                />
                <StatsCard
                    label="Account status"
                    value="Active"
                    icon={ShieldCheck}
                    description="Deactivation requires a schema flag"
                />
                <StatsCard
                    label="Joined"
                    value={createdAt ? formatDateTime(createdAt) : "—"}
                    icon={Database}
                    description="Sign-up date from the AIStudyHub API"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="admin-card lg:col-span-1">
                    <h2 className="admin-card-title">Profile</h2>
                    <p className="admin-card-subtitle">Snapshot of this account</p>
                    <dl className="mt-4 space-y-3 text-sm">
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-light-400">Name</dt>
                            <dd className="font-semibold text-dark-100">{user.fullName}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-light-400">Email</dt>
                            <dd className="text-dark-100">{user.email}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-light-400">Username</dt>
                            <dd className="text-dark-100">{user.username ? `@${user.username}` : "—"}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-light-400">Role</dt>
                            <dd>
                                <span
                                    className={`admin-badge ${
                                        user.role === "admin" ? "admin-badge-admin" : "admin-badge-user"
                                    }`}
                                >
                                    {user.role === "admin" ? "Admin" : "User"}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-light-400">Joined</dt>
                            <dd className="text-light-100">
                                {createdAt ? formatDateTime(createdAt) : "—"}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-6 flex flex-col gap-2">
                        <div className="rounded-xl border border-dashed border-light-300 bg-light-300/30 p-3 text-xs text-light-400">
                            <p className="font-semibold text-dark-100">Activate / Deactivate</p>
                            <p className="mt-1">
                                Account status toggling requires a <code className="rounded bg-light-300 px-1">status</code>{" "}
                                column on the users table, which cannot be added in this change.
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-light-300 bg-white px-4 py-2 text-xs font-semibold text-light-400 opacity-60 cursor-not-allowed"
                            aria-disabled="true"
                            title="Account status flag not available"
                        >
                            <ShieldOff className="size-3.5" /> Deactivate account
                        </button>
                    </div>
                </div>

                <div className="admin-card lg:col-span-2">
                    <h2 className="admin-card-title">Subscription</h2>
                    <p className="admin-card-subtitle">Change this user's tier via the AIStudyHub API</p>
                    <div className="mt-6">
                        <TierSwitcher currentTier={tier} onSubmit={handleTierChange} />
                    </div>
                </div>
            </div>

            <section className="admin-card">
                <div className="admin-card-header">
                    <div>
                        <h2 className="admin-card-title">Recent platform documents</h2>
                        <p className="admin-card-subtitle">Latest uploads across the platform</p>
                    </div>
                    <span className="text-xs text-light-400">{userFiles.total} total</span>
                </div>
                {userFiles.documents.length > 0 ? (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Owner</th>
                                    <th>Type</th>
                                    <th className="hidden md:table-cell">Uploaded</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userFiles.documents.map((f) => {
                                    const fileId = f.id ?? f.$id ?? "";
                                    return (
                                        <tr key={fileId}>
                                            <td>
                                                <span className="truncate text-sm text-dark-100">
                                                    {f.title ?? f.name ?? "Untitled"}
                                                </span>
                                            </td>
                                            <td className="text-sm text-light-100">{f.ownerName ?? "—"}</td>
                                            <td>
                                                <span className="admin-badge admin-badge-user capitalize">
                                                    {f.type ?? "document"}
                                                </span>
                                            </td>
                                            <td className="hidden md:table-cell text-xs text-light-400">
                                                {f.createdAt ? formatDateTime(f.createdAt) : "—"}
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
                        description="The platform has no uploaded documents."
                        icon={Database}
                    />
                )}

                {userFiles.total > PAGE_LIMIT && (
                    <div className="admin-pagination mt-4">
                        <p className="admin-pagination-info">
                            Page <span className="font-semibold text-dark-100">{page}</span> of{" "}
                            <span className="font-semibold text-dark-100">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            {hasPrev ? (
                                <Link
                                    href={`/admin/users/${id}?page=${page - 1}`}
                                    className="admin-pagination-button"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="size-4" /> Previous
                                </Link>
                            ) : (
                                <span className="admin-pagination-button cursor-not-allowed opacity-50">
                                    <ChevronLeft className="size-4" /> Previous
                                </span>
                            )}
                            {hasNext ? (
                                <Link
                                    href={`/admin/users/${id}?page=${page + 1}`}
                                    className="admin-pagination-button"
                                    aria-label="Next page"
                                >
                                    Next <ChevronRight className="size-4" />
                                </Link>
                            ) : (
                                <span className="admin-pagination-button cursor-not-allowed opacity-50">
                                    Next <ChevronRight className="size-4" />
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
