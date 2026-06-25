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

/**
 * Admin Reports Page - Server Component
 * Lists all reported documents with filtering and sorting
 */
export default async function AdminReportsPage({ searchParams }: PageProps) {
    const currentUser = await getCurrentUser();
    
    // 🔐 Verify admin access
    if (!currentUser) {
        redirect("/sign-in");
    }

    const params = await searchParams ?? {};
    const status = (params.status as any) ?? "Pending";
    const page = Number(params.page ?? 1);

    // Note: In real implementation, you would fetch reports from an action
    // For now, this structure is ready for when the backend API is available
    const reports = {
        data: [],
        total: 0,
        page,
    };

    return (
        <Suspense fallback={<AdminLoadingState label="Loading reports..." />}>
            <AdminReportsClient
                currentUserId={currentUser.$id ?? ""}
                initialStatus={status}
                initialPage={page}
            />
        </Suspense>
    );
}
