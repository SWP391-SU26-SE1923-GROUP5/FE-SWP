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
                                <li key={file.id} className="flex items-center justify-between gap-3">
                                <FilePreviewWrapper file={file} className="flex items-center gap-3 flex-1">
                                    <Thumbnail type={file.fileType} extension={file.fileExtension} url={file.fileLink} />
                                    <div className="recent-file-details">
                                        <div className="flex flex-col gap-1">
                                            <p className="recent-file-name">{file.fileName}</p>
                                            <FormattedDateTime date={file.createdAt || ""} className="caption" />
                                        </div>
                                    </div>
                                </FilePreviewWrapper>

                                <StatusPoller fileId={file.id} status={file.status} />

                                <div className="flex items-center gap-2 mr-2 flex-wrap justify-end">
                                    <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1.5 shadow-drop-3">
                                        <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="line-clamp-1 max-w-[120px]">{subjectName}</span>
                                    </span>
                                    {(file.status === 5 || String(file.status).toLowerCase() === "processing") && (
                                        <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5 shadow-drop-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                            AI Processing...
                                        </span>
                                    )}
                                    {(file.status === 2 || String(file.status).toLowerCase() === "done") && (
                                        <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-emerald-50 text-brand border border-brand/30 shadow-drop-3">
                                            ✓ AI Completed
                                        </span>
                                    )}
                                    {(file.status === 6 || String(file.status).toLowerCase() === "failed") && (
                                        <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200 shadow-drop-3">
                                            ⚠ Failed
                                        </span>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    <ActionDropdown file={file} />
                                </div>
                            </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="empty-list">No files uploaded</p>
                )}
            </section>
        </div>
    );
};

export default Dashboard;