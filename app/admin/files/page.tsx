import { Suspense } from "react";
import { FileText, Image, Video, Music } from "lucide-react";
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

    const countByType = (type: string) =>
        initial.documents.filter((f) => f.type === type).length;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-100">Document Management</h1>
                    <p className="text-sm text-light-400 mt-0.5">Browse and moderate uploaded files</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-light-100">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-dark-100">{initial.total}</p>
                        <p className="text-[11px] text-light-400 font-medium uppercase tracking-wide">Total Files</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-light-100">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-dark-100">{countByType("document")}</p>
                        <p className="text-[11px] text-light-400 font-medium uppercase tracking-wide">Documents</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-light-100">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Image className="size-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-dark-100">{countByType("image")}</p>
                        <p className="text-[11px] text-light-400 font-medium uppercase tracking-wide">Images</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-light-100">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Video className="size-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-dark-100">{countByType("video")}</p>
                        <p className="text-[11px] text-light-400 font-medium uppercase tracking-wide">Videos</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-light-100">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Music className="size-5" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-dark-100">{countByType("audio")}</p>
                        <p className="text-[11px] text-light-400 font-medium uppercase tracking-wide">Audio</p>
                    </div>
                </div>
            </div>

            <Suspense fallback={<AdminLoadingState label="Loading files..." />}>
                <AdminFilesClient initialData={initial} />
            </Suspense>
        </div>
    );
}
