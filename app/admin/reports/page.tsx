import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/AdminSearchBar";
import AdminReportsClient from "./AdminReportsClient";

export const metadata = {
    title: "Reports · Admin",
};

interface PageProps {
    searchParams: Promise<{ search?: string; status?: string; sort?: string; page?: string }>;
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
    void (await searchParams);
    return (
        <Suspense fallback={<AdminLoadingState label="Loading reports..." />}>
            <AdminReportsClient />
        </Suspense>
    );
}