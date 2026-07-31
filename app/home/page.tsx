import Image from "next/image";
import Link from "next/link";
import ActionDropdown from "@/components/ActionDropdown";
import { Chart } from "@/components/Chart";
import { Separator } from "@/components/ui/separator";
import { getFiles, getTotalSpaceUsed, getSubjects } from "@/lib/actions/file.actions";
import { convertFileSize, getUsageSummary } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import FormattedDateTime from "@/components/FormattedDateTime";
import Thumbnail from "@/components/Thumbnail";
import { File_ } from "@/types";
import StatusPoller from "@/components/StatusPoller";
import FilePreviewWrapper from "@/components/FilePreviewWrapper";

interface DashboardProps {
    searchParams?: Promise<{ subjectId?: string }>;
}

const Dashboard = async ({ searchParams }: DashboardProps) => {
    const params = await searchParams;
    const subjectId = params?.subjectId || "";

    const [files, totalSpace, subjects] = await Promise.all([
        getFiles({ types: [], limit: 10, subjectId }),
        getTotalSpaceUsed(),
        getSubjects(),
    ]);

    const usageSummary = getUsageSummary(totalSpace);

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
            <section className="dashboard-recent-files">
                <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
                {files.documents.length > 0 ? (
                    <ul className="mt-5 flex flex-col gap-5">
                        {files.documents.map((file: File_) => {
                            const fileSubject = subjects?.find((s: any) => s.id === file.subjectId);
                            const subjectName = (file as any).subjectName || (file as any).subject?.subjectName || fileSubject?.subjectName || fileSubject?.subjectCode || "General";

                            return (
                                <li key={file.id} className="flex items-center justify-between gap-2 sm:gap-3 py-2 border-b border-light-400/30 last:border-0">
                                    <FilePreviewWrapper file={file} className="flex items-center gap-3 flex-1 min-w-0">
                                        <Thumbnail type={file.fileType} extension={file.fileExtension} url={file.fileLink} />
                                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                                            <p className="subtitle-2 line-clamp-1 truncate w-full text-light-100">{file.fileName}</p>
                                            <FormattedDateTime date={file.createdAt || ""} className="caption" />
                                        </div>
                                    </FilePreviewWrapper>

                                    <StatusPoller fileId={file.id} status={file.status} />

                                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-1.5">
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1 shadow-xs max-w-[110px] sm:max-w-[130px]">
                                                <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                                                <span className="truncate">{subjectName}</span>
                                            </span>
                                            {(file.status === 5 || String(file.status).toLowerCase() === "processing") && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1 shadow-xs whitespace-nowrap">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                                    AI Processing...
                                                </span>
                                            )}
                                            {(file.status === 2 || String(file.status).toLowerCase() === "done") && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-brand border border-brand/30 shadow-xs whitespace-nowrap">
                                                    ✓ AI Completed
                                                </span>
                                            )}
                                            {(file.status === 6 || String(file.status).toLowerCase() === "failed") && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200 shadow-xs whitespace-nowrap">
                                                    ⚠ Failed
                                                </span>
                                            )}
                                        </div>

                                        <div className="shrink-0 flex items-center">
                                            <ActionDropdown file={file} />
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
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