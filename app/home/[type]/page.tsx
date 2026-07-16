import Sort from "@/components/Sort";
import Pagination from "@/components/Pagination";
import { getFiles, getSubjects } from "@/lib/actions/file.actions";
import { File_, FileType, SearchParamProps } from "@/types";
import Card from "@/components/Card";
import { getFileTypesParams, convertFileSize } from "@/lib/utils";

const Page = async ({ searchParams, params }: SearchParamProps) => {
    const resolvedSearchParams = await searchParams;
    const resolvedParams = await params;

    const type = resolvedParams?.type as string || "";
    const searchText = (resolvedSearchParams?.query as string) || "";
    const sort = (resolvedSearchParams?.sort as string) || "";
    const subjectId = (resolvedSearchParams?.subjectId as string) || "";
    const page = Number(resolvedSearchParams?.page) || 1;
    const limit = Number(resolvedSearchParams?.limit) || 12;

    const types = getFileTypesParams(type) as FileType[];

    const [files, subjects] = await Promise.all([
        getFiles({ types, searchText, sort, subjectId, page, limit }),
        getSubjects()
    ]);

    const totalSizeInBytes = files.documents.reduce((acc: number, file: File_) => {
        return acc + (file.fileSizeBytes || 0);
    }, 0);

    const totalPages = Math.max(1, Math.ceil((files.total || 0) / limit));

    return (
        <div className="page-container flex flex-col flex-1 h-full">
            <section className="w-full">
                <h1 className="h1 capitalize text-dark-200">{type}</h1>

                <div className="total-size-section mt-4 mb-6">
                    <p className="body-1 text-slate-500">
                        Total Size: <span className="h5 text-dark-200 font-bold ml-1">{convertFileSize(totalSizeInBytes)}</span>
                    </p>

                    <div className="sort-container flex items-center gap-2">
                        <p className="body-1 hidden sm:block text-slate-500">Sort by:</p>
                        <Sort subjects={subjects} />
                    </div>
                </div>
            </section>

            {files.documents && files.documents.length > 0 ? (
                <div className="flex flex-col flex-1 justify-between">
                    <section className="file-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {files.documents.map((file: File_) => (
                            <Card key={file.id} file={file} />
                        ))}
                    </section>

                    <div className="w-full mt-auto pt-6">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={files.total}
                            itemsPerPage={limit}
                        />
                    </div>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center justify-center flex-1 py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl mt-4">
                    <p className="text-base font-semibold text-slate-600 mb-1">No {type} found</p>
                    <p className="text-xs text-slate-400">Upload new documents using the upload button above.</p>
                </div>
            )}
        </div>
    );
};

export default Page;