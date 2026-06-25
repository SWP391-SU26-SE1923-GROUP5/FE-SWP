import { Suspense } from "react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import AdminReportsClient from "./AdminReportsClient";
import { AdminLoadingState } from "@/components/admin/AdminSearchBar";

export const metadata = {
    title: "Reports · Admin",
};

interface PageProps {
    searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
        redirect("/sign-in");
    }

    const params = await searchParams ?? {};
    const status = (params.status as any) ?? "Pending";
    const page = Number(params.page ?? 1);

    const reports = {
        data: [],
        total: 0,
        page,
    };

    return (
        <Suspense fallback={<AdminLoadingState label="Loading reports..." />}>
            <AdminReportsClient
                currentUserId={currentUser.id ?? ""}
                initialStatus={status}
                initialPage={page}
            />
        </Suspense>
    );
}
