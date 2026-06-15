import { Suspense } from "react";
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
        <Suspense fallback={<AdminLoadingState label="Loading users..." />}>
            <AdminUsersClient
                currentUserId={currentUser?.$id ?? ""}
                initialData={initial}
            />
        </Suspense>
    );
}
