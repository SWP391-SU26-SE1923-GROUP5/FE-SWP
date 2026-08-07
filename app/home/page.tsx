import React from "react";
import Image from "next/image";
import Link from "next/link";
import ActionDropdown from "@/components/ActionDropdown";
import { Chart } from "@/components/Chart";
import { Separator } from "@/components/ui/separator";
import { getFiles, getTotalSpaceUsed, getSubjects } from "@/lib/actions/file.actions";
import { convertFileSize, getUsageSummary, getFileType, getFileTypesParams } from "@/lib/utils";
import { BookOpen, Calendar } from "lucide-react";
import SubjectFilter from "@/components/SubjectFilter";
import TypeFilter from "@/components/TypeFilter";
import FormattedDateTime from "@/components/FormattedDateTime";
import Thumbnail from "@/components/Thumbnail";
import { File_, FileType } from "@/types";
import FilePreviewWrapper from "@/components/FilePreviewWrapper";

interface DashboardProps {
    searchParams?: Promise<{ subjectId?: string, type?: string, limit?: string }>;
}

const Dashboard = async ({ searchParams }: DashboardProps) => {
    const params = await searchParams;
    const subjectId = params?.subjectId || "";
    const typeParam = params?.type || "all";
    const limit = Number(params?.limit) || 10;
    
    const types = typeParam === "all" ? [] : getFileTypesParams(typeParam) as FileType[];

    const [files, totalSpace, subjects] = await Promise.all([
        getFiles({ types, limit, subjectId }),
        getTotalSpaceUsed(),
        getSubjects(),
    ]);

    const usageSummary = getUsageSummary(totalSpace);
    
    let lastDate = "";

    return (
        <div className="dashboard-container relative">
            <section>
                <Chart used={totalSpace.used} />
                <ul className="dashboard-summary-list">
                    {usageSummary.map((summary) => (
                        <Link href={summary.url} key={summary.title} className="dashboard-summary-card">
                            <div className="space-y-4">
                                <div className="flex justify-between gap-3">
                                    <Image src={summary.icon} width={100} height={100} alt="uploaded image" className="summary-type-icon" />
                                    <h4 className="summary-type-size">{convertFileSize(summary.size) || 0}</h4>
                                </div>
                                <h5 className="summary-type-title">{summary.title}</h5>
                                <Separator className="bg-light-400" />
                                <FormattedDateTime date={summary.latestDate} className="text-center" />
                            </div>
                        </Link>
                    ))}
                </ul>
            </section>
            <section className="dashboard-recent-files w-full">
                <div className="flex flex-col w-full gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                        <h2 className="h3 xl:h2 text-light-100">
                            Recent files uploaded
                            {files.total !== undefined && (
                                <span className="text-sm font-normal text-light-400 ml-2">
                                    (Showing {files.documents.length} of {files.total} files)
                                </span>
                            )}
                        </h2>
                        <SubjectFilter subjects={subjects || []} />
                    </div>
                    <TypeFilter />
                </div>
                {files.documents.length > 0 ? (
                    <div className="mt-5 flex flex-col">
                        <ul className="flex flex-col gap-3">
                            {files.documents.map((file: File_) => {
                                const fileSubject = subjects?.find((s: any) => s.id === file.subjectId);
                                const subjectName = (file as any).subjectName || (file as any).subject?.subjectName || fileSubject?.subjectName || fileSubject?.subjectCode || "General";
                                const { type, extension } = getFileType(file.fileName);
                                
                                const fileDate = new Date(file.createdAt || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                const showHeader = fileDate !== lastDate;
                                lastDate = fileDate;

                                return (
                                    <React.Fragment key={file.id}>
                                        {showHeader && (
                                            <div className="flex items-center gap-2 mt-4 mb-1 first:mt-0">
                                                <Calendar className="w-4 h-4 text-light-400" />
                                                <span className="text-xs font-bold text-light-400 uppercase tracking-wider">{fileDate}</span>
                                            </div>
                                        )}
                                        <li className="flex items-center justify-between gap-2 sm:gap-3 py-2 border-b border-light-400/30 last:border-0 hover:bg-light-800/20 dark:hover:bg-dark-300/20 rounded-xl px-2 -mx-2 transition-colors">
                                            <FilePreviewWrapper file={file} className="flex items-center gap-3 flex-1 min-w-0">
                                                <Thumbnail type={type} extension={extension} url={file.fileLink} />
                                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                    <p className="subtitle-2 line-clamp-1 truncate w-full text-light-100">{file.fileName}</p>
                                                    <FormattedDateTime date={file.createdAt || ""} className="caption" />
                                                </div>
                                            </FilePreviewWrapper>
                                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-1.5">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1 shadow-xs max-w-[110px] sm:max-w-[130px]">
                                                        <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                                                        <span className="truncate">{subjectName}</span>
                                                    </span>
                                                </div>
                                                <div className="shrink-0 flex items-center">
                                                    <ActionDropdown file={file} />
                                                </div>
                                            </div>
                                        </li>
                                    </React.Fragment>
                                );
                            })}
                        </ul>
                        
                        {files.total > files.documents.length && (
                            <div className="mt-8 flex justify-center pb-4">
                                <Link 
                                    href={`/home?${new URLSearchParams({
                                        ...(subjectId !== "all" && subjectId ? { subjectId } : {}),
                                        ...(typeParam !== "all" ? { type: typeParam } : {}),
                                        limit: (limit + 10).toString()
                                    }).toString()}`}
                                    scroll={false}
                                    className="px-6 py-2.5 bg-brand/10 hover:bg-brand/20 text-brand font-bold text-sm rounded-full transition-colors cursor-pointer"
                                >
                                    Load More Files
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl mt-5">
                        <p className="text-base font-semibold text-slate-600 mb-1">No files uploaded yet</p>
                        <p className="text-xs text-slate-400 max-w-sm">Upload your first study document or media using the upload button above to start generating AI quizzes and flashcards!</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;