"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button";
import { cn, convertFileToUrl, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { MAX_FILE_SIZE } from "@/constants/fileSize";
import { toast } from "sonner"
import { uploadFile } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { Subject } from "@/types";
import { ChevronDown, BookOpen } from "lucide-react";

interface FileUploaderProps {
    subjects: Subject[];
    className?: string;
}

const FileUploader = ({ subjects, className }: FileUploaderProps) => {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const path = usePathname()

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!selectedSubjectId) {
            toast.error("Please select a subject before uploading.");
            return;
        }

        setFiles(acceptedFiles);

        const uploadPromises = acceptedFiles.map(async file => {
            if (file.size > MAX_FILE_SIZE) {
                setFiles((prevFiles) =>
                    prevFiles.filter((f) => f.name !== file.name)
                );
                return toast.error(`${file.name} is too large. Max file size is 50MB.`);
            }

            return uploadFile({ file, path, subjectId: selectedSubjectId }).then((uploadedFile) => {
                if (uploadedFile) {
                    setFiles((prevFiles) =>
                        prevFiles.filter((f) => f.name !== file.name)
                    );
                }
            });
        })

        await Promise.all(uploadPromises)
    }, [path, selectedSubjectId])

    const { getRootProps, getInputProps } = useDropzone({ onDrop })

    const handleRemoveFile = (e: React.MouseEvent<HTMLImageElement, MouseEvent>, fileName: string) => {
        e.stopPropagation();
        setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
    }

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className="relative flex items-center">
                <BookOpen className="absolute left-5 w-4 h-4 text-emerald-600 pointer-events-none" />

                <select
                    className="h-[52px] pl-11 pr-11 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-medium appearance-none outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[200px] text-sm"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                    <option value="" disabled>Select a subject...</option>
                    {subjects?.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.subjectName}
                        </option>
                    ))}
                </select>

                <ChevronDown className="absolute right-5 w-4 h-4 text-emerald-600 pointer-events-none" />
            </div>

            <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />

                <Button type="button" className="uploader-button py-6 px-10 rounded-full cursor-pointer">
                    <Image
                        src="/assets/icons/upload.svg"
                        alt="upload"
                        width={24}
                        height={24}
                    />
                    <p>Upload</p>
                </Button>
            </div>

            {files.length > 0 &&
                <ul className="uploader-preview-list">
                    <h4 className="h4 text-light-100">Uploading</h4>

                    {files.map((file: File, index) => {
                        const { type, extension } = getFileType(file.name)
                        return (
                            <li key={`${file.name}-${index}`} className="uploader-preview-item">
                                <div className="flex items-center gap-3">
                                    <Thumbnail
                                        type={type}
                                        url={convertFileToUrl(file)}
                                        extension={extension}
                                    />

                                    <div className="preview-item-name">
                                        {file.name}
                                        <Image
                                            src="/assets/icons/file-loader.gif"
                                            width={80}
                                            height={26}
                                            alt="Loader"
                                        />
                                    </div>
                                </div>

                                <Image
                                    src="/assets/icons/remove.svg"
                                    width={24}
                                    height={24}
                                    alt="Remove"
                                    onClick={(e) => handleRemoveFile(e, file.name)}
                                />
                            </li>
                        )
                    })}
                </ul>
            }
        </div>
    )
}

export default FileUploader