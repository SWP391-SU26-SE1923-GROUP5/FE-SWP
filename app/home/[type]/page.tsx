import Sort from "@/components/Sort";
import { getFiles, getSubjects } from "@/lib/actions/file.actions";
import { File_, FileType, SearchParamProps } from "@/types";
import Card from "@/components/Card";
import { getFileTypesParams } from "@/lib/utils";

const Page = async ({ searchParams, params }: SearchParamProps) => {
    const resolvedSearchParams = await searchParams;
    const resolvedParams = await params;

    const type = resolvedParams?.type as string || "";
    const searchText = (resolvedSearchParams?.query as string) || "";
    const sort = (resolvedSearchParams?.sort as string) || "";
    const subjectId = (resolvedSearchParams?.subjectId as string) || "";

    const types = getFileTypesParams(type) as FileType[];

    const [files, subjects] = await Promise.all([
        getFiles({ types, searchText, sort, subjectId }),
        getSubjects()
    ]);

    return (
        <div className="page-container">
            <section className="w-full">
                <h1 className="h1 capitalize">{type}</h1>

                <div className="total-size-section">
                    <p className="body-1">
                        Total: <span className="h5">0 MB</span>
                    </p>

                    <div className="sort-container">
                        <p className="body-1 hidden sm:block text-light-200">Sort by:</p>
                        <Sort subjects={subjects} />
                    </div>
                </div>
            </section>

            {files.documents.length > 0 ? (
                <section className="file-list">
                    {files.documents.map((file: File_) => (
                        <Card key={file.id} file={file}/>
                    ))}
                </section>
            ) : (
                <p className="empty-list">No files uploaded</p>
            )}
        </div>
    );
};

export default Page;