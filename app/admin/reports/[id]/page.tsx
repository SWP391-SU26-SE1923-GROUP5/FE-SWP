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

export default async function AdminReportDetailPage({ params }: PageProps) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
        redirect("/sign-in");
    }

    return (
        <Suspense fallback={<AdminLoadingState label="Loading report..." />}>
            <AdminReportDetailClient
                reportId={id}
                currentUserId={currentUser.id ?? ""}
            />
        </Suspense>
    );
}
