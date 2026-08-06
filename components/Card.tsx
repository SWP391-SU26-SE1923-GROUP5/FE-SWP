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
        <FilePreviewWrapper file={file} className="file-card w-full p-0 flex flex-col">
            <div className="w-full bg-indigo-50/80 border-b border-indigo-100 rounded-t-[18px] px-5 py-2.5 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider line-clamp-1">{subjectName}</span>
            </div>

            <div className="p-5 pt-4 flex flex-col gap-6 flex-1 w-full">
                <div className="flex justify-between w-full">
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

            <div className="file-card-details w-full">
                <p className="subtitle-2 line-clamp-1">{file.fileName}</p>
                <FormattedDateTime
                    date={file.createdAt || ""}
                    className="body-2 text-light-100"
                />
                <p className="caption line-clamp-1 text-light-200">By: {owner?.fullName || "Unknown User"}</p>
            </div>
            </div>
        </FilePreviewWrapper>
    )
}
export default Card
