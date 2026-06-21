import { Suspense } from "react";
import { getAdminFiles } from "@/lib/actions/admin.actions";
import AdminDocumentViolationsClient from "./AdminDocumentViolationsClient";
import { AdminLoadingState } from "@/components/admin/AdminSearchBar";

export const metadata = {
    title: "Document Violations · Admin",
};

interface PageProps {
    searchParams: Promise<{ search?: string; status?: string; sort?: string; page?: string }>;
}

export default async function AdminDocumentViolationsPage({ searchParams }: PageProps) {
    const params = (await searchParams) ?? {};
    let initial;
    try {
        initial = await getAdminFiles({
            search: params.search ?? "",
            type: "all",
            status: (params.status as "all" | "active" | "removed" | undefined) ?? "all",
            sort: params.sort ?? "$createdAt-desc",
            page: Number(params.page ?? 1),
            limit: 20,
        });
    } catch {
        initial = { documents: [], total: 0 };
    }

    return (
        <Suspense fallback={<AdminLoadingState label="Loading documents..." />}>
            <AdminDocumentViolationsClient initialData={initial} />
        </Suspense>
    );
}