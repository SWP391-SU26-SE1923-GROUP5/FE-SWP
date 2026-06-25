import { Suspense } from "react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import AdminReportDetailClient from "./AdminReportDetailClient";
import { AdminLoadingState } from "@/components/admin/AdminSearchBar";

export const metadata = {
    title: "Report Detail · Admin",
};

interface PageProps {
    params: Promise<{ id: string }>;
}

/**
 * Admin Report Detail Page - Server Component
 * Shows detailed report information and allows admin to take action
 */
export default async function AdminReportDetailPage({ params }: PageProps) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    
    // 🔐 Verify admin access
    if (!currentUser) {
        redirect("/sign-in");
    }

    return (
        <Suspense fallback={<AdminLoadingState label="Loading report..." />}>
            <AdminReportDetailClient
                reportId={id}
                currentUserId={currentUser.$id ?? ""}
            />
        </Suspense>
    );
}
