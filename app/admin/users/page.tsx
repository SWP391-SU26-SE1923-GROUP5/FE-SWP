import { Suspense } from "react";
import { Users, Shield, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { getAdminUsers } from "@/lib/actions/admin.actions";
import AdminUsersClient from "./AdminUsersClient";
import { AdminLoadingState } from "@/components/admin/AdminSearchBar";

export const metadata = {
    title: "Users · Admin",
};

interface PageProps {
    searchParams: Promise<{ search?: string; role?: string; sort?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const params = (await searchParams) ?? {};
    const currentUser = await getCurrentUser();
    const initial = await getAdminUsers({
        search: params.search ?? "",
        role: (params.role as any) ?? "all",
        sort: params.sort ?? "$createdAt-desc",
        page: Number(params.page ?? 1),
        limit: 20,
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-100">User Management</h1>
                    <p className="text-sm text-light-400 mt-0.5">Manage all registered accounts and roles</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-light-100">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Users className="size-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-dark-100">{initial.total}</p>
                        <p className="text-xs text-light-400 font-medium uppercase tracking-wide">Total Registered</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-light-100">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Shield className="size-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-dark-100">
                            {initial.documents.filter((u) => u.role === "admin").length}
                        </p>
                        <p className="text-xs text-light-400 font-medium uppercase tracking-wide">Admins (page)</p>
                    </div>
                </div>
            </div>

            <Suspense fallback={<AdminLoadingState label="Loading users..." />}>
                <AdminUsersClient
                    currentUserId={currentUser?.id ?? ""}
                    initialData={initial}
                />
            </Suspense>
        </div>
    );
}
