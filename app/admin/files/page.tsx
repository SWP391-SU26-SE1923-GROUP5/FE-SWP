import { Suspense } from "react";
import { getAdminFiles } from "@/lib/actions/admin.actions";
import AdminFilesClient from "./AdminFilesClient";
import { AdminLoadingState } from "@/components/admin/AdminSearchBar";

export const metadata = {
    title: "Files · Admin",
};

interface PageProps {
    searchParams: Promise<{ search?: string; type?: string; sort?: string; page?: string }>;
}

export default async function AdminFilesPage({ searchParams }: PageProps) {
    const params = (await searchParams) ?? {};
    const initial = await getAdminFiles({
        search: params.search ?? "",
        type: (params.type as any) ?? "all",
        sort: params.sort ?? "$createdAt-desc",
        page: Number(params.page ?? 1),
        limit: 20,
    });

    return (
        <Suspense fallback={<AdminLoadingState label="Loading files..." />}>
            <AdminFilesClient initialData={initial} />
        </Suspense>
    );
}
