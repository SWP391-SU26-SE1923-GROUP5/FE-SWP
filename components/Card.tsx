import { File_, Subject } from "@/types";
import Thumbnail from "@/components/Thumbnail";
import {convertFileSize, getFileType} from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";
import {getUserById} from "@/lib/actions/user.actions";
import ActionDropdown from "@/components/ActionDropdown";
import FilePreviewWrapper from "@/components/FilePreviewWrapper";
import { getSubjects } from "@/lib/actions/file.actions";
import { BookOpen } from "lucide-react";

const Card = async ({ file, subjects }: { file: File_; subjects?: Subject[] }) => {
    const owner = await getUserById(file.userId);
    const allSubjects = subjects || await getSubjects();
    const fileSubject = allSubjects?.find((s: Subject) => s.id === file.subjectId);
    const subjectName = file.subjectName || file.subject?.subjectName || fileSubject?.subjectName || fileSubject?.subjectCode || "General";

    const { type, extension } = getFileType(file.fileName);

    return (
        <FilePreviewWrapper file={file} className="file-card">
            <div className="flex justify-between">
                <Thumbnail
                    type={type}
                    extension={extension}
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
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-[20px] text-[11px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1.5 shadow-drop-3">
                        <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="line-clamp-1 max-w-[120px]">{subjectName}</span>
                    </span>
                </div>
            </div>

        </FilePreviewWrapper>
    )
}
export default Card
