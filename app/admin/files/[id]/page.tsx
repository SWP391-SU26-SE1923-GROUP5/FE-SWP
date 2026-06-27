import { redirect } from "next/navigation";
import AdminFileDetailClient from "./AdminFileDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminFileDetailPage({ params }: PageProps) {
    const { id } = await params;
    if (!id) redirect("/admin/files");

    return <AdminFileDetailClient fileId={id} />;
}
