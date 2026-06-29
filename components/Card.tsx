import { File_ } from "@/types";
import Link from "next/link";
import Thumbnail from "@/components/Thumbnail";
import {convertFileSize} from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";
import {getUserById} from "@/lib/actions/user.actions";
import ActionDropdown from "@/components/ActionDropdown";
import StatusPoller from "@/components/StatusPoller";
import FilePreviewWrapper from "@/components/FilePreviewWrapper";
import { getSubjects } from "@/lib/actions/file.actions";
import { BookOpen } from "lucide-react";

const Card = async ({ file, subjects }: { file: File_; subjects?: any[] }) => {
    const owner = await getUserById(file.userId);
    const allSubjects = subjects || await getSubjects();
    const fileSubject = allSubjects?.find((s: any) => s.id === file.subjectId);
    const subjectName = (file as any).subjectName || (file as any).subject?.subjectName || fileSubject?.subjectName || fileSubject?.subjectCode || "General";

    return (
        <FilePreviewWrapper file={file} className="file-card">
            <div className="flex justify-between">
                <Thumbnail
                    type={file.fileType}
                    extension={file.fileExtension.replace('.', '')}
                    url={file.fileLink}
                    className="!size-20"
                    imageClassName="!size-11"
                />

                <div className="flex flex-col items-end justify-between">
                    <ActionDropdown file={file} />

                    <p className="body-1">{convertFileSize(file.fileSizeBytes || 0)}</p>
                </div>
            </div>

            <div className="file-card-details">
                <p className="subtitle-2 line-clamp-1">{file.fileName}</p>
                <FormattedDateTime
                    date={file.createdAt || ""}
                    className="body-2 text-light-100"
                />
                <p className="caption line-clamp-1 text-light-200">By: {owner?.fullName || "Unknown User"}</p>
                <StatusPoller fileId={file.id} status={file.status} />
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1.5 shadow-drop-3">
                        <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="line-clamp-1 max-w-[120px]">{subjectName}</span>
                    </span>
                    {file.status === 5 && (
                        <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5 shadow-drop-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            AI Processing...
                        </span>
                    )}
                    {file.status === 2 && (
                        <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-emerald-50 text-brand border border-brand/30 shadow-drop-3">
                            ✓ AI Completed
                        </span>
                    )}
                    {file.status === 6 && (
                        <span
                            className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200 cursor-help shadow-drop-3"
                        >
                            ⚠ Failed (Hover for details)
                        </span>
                    )}
                </div>
            </div>

        </FilePreviewWrapper>
    )
}
export default Card
