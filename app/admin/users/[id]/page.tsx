import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getAdminUserById } from "@/lib/actions/admin.actions";
import UserForm from "@/components/admin/UserForm";
import { updateAdminUser } from "@/lib/actions/admin.actions";
import type { AdminUser } from "@/types/admin";
import { convertFileSize, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AdminUserDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
    const { id } = await params;
    const me = await getCurrentUser();
    if (!me) redirect("/sign-in");

    const user = await getAdminUserById(id);
    if (!user) notFound();

    const handleUpdate = async (data: any) => {
        "use server";
        await updateAdminUser(id, data);
    };

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
                            <dd className="text-dark-100">@{user.username}</dd>
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
                                {user.createdAt ? formatDateTime(user.createdAt) : "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wider text-light-400">Activity</dt>
                            <dd className="text-light-100">
                                {user.filesCount ?? 0} files · {convertFileSize(user.totalStorage ?? 0)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="admin-card lg:col-span-2">
                    <h2 className="admin-card-title">Edit user</h2>
                    <p className="admin-card-subtitle">Update details and role</p>
                    <div className="mt-6">
                        <UserForm
                            mode="edit"
                            defaultValues={{
                                fullName: user.fullName,
                                username: user.username,
                                email: user.email,
                                role: user.role,
                            }}
                            onSubmit={handleUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
