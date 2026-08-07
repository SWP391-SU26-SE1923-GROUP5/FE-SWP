"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button";
import { cn, convertFileToUrl, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { MAX_FILE_SIZE } from "@/constants/fileSize";
import { toast } from "sonner";
import { uploadFile, getSubjects } from "@/lib/actions/file.actions";
import { usePathname } from "next/navigation";
import { Subject } from "@/types";
import { ChevronDown, BookOpen, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ALLOWED_EXTENSIONS = [
    ".pdf", "pdf",
    ".docx", "docx",
    ".txt", "txt",
    ".md", "md",
    ".jpg", "jpg",
    ".jpeg", "jpeg",
    ".png", "png",
    ".gif", "gif",
    ".mp4", "mp4",
    ".avi", "avi",
    ".mov", "mov",
    ".webm", "webm",
    ".mp3", "mp3",
    ".wav", "wav",
    ".ogg", "ogg",
    ".m4a", "m4a",
    ".xlsx", "xlsx",
    ".xls", "xls",
    ".pptx", "pptx",
    ".ppt", "ppt",
    ".csv", "csv",
    ".json", "json"
];

interface FileUploaderProps {
    subjects?: Subject[];
    className?: string;
}

const FileUploader = ({ subjects, className }: FileUploaderProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [fileSubjects, setFileSubjects] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [subjectsList, setSubjectsList] = useState<Subject[]>(subjects || []);
    const path = usePathname();

    React.useEffect(() => {
        if (subjects && subjects.length > 0) {
            setSubjectsList(subjects);
        }
    }, [subjects]);

    React.useEffect(() => {
        let isMounted = true;
        if (!subjects || subjects.length === 0) {
            getSubjects()
                .then(res => {
                    if (isMounted && res && Array.isArray(res)) setSubjectsList(res);
                })
                .catch(err => console.error("Failed to load fallback subjects:", err));
        }
        return () => {
            isMounted = false;
        };
    }, [subjects]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const validFiles = acceptedFiles.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} exceeds maximum file size of 5MB.`);
                return false;
            }

            const fileNameParts = file.name.split('.');
            if (fileNameParts.length < 2) {
                toast.error(`${file.name} has an unsupported or missing format.`);
                return false;
            }
            
            const ext = fileNameParts.pop()?.toLowerCase() || '';
            if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_EXTENSIONS.includes(`.${ext}`)) {
                toast.error(`File ${file.name} has an unsupported extension.`);
                return false;
            }

            return true;
        });

        if (validFiles.length > 0) {
            setFiles(prev => {
                const existingNames = new Set(prev.map(f => f.name));
                const newUniqueFiles = validFiles.filter(f => !existingNames.has(f.name));
                return [...prev, ...newUniqueFiles];
            });
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleRemoveFile = (e: React.MouseEvent, fileName: string) => {
        e.stopPropagation();
        setFiles(prev => prev.filter(file => file.name !== fileName));
        setFileSubjects(prev => {
            const updated = { ...prev };
            delete updated[fileName];
            return updated;
        });
    };

    const handleUploadSubmit = async () => {
        if (files.length === 0) {
            toast.error("Please select at least one file to upload.");
            return;
        }
        
        const missingSubjects = files.some(file => !fileSubjects[file.name]);
        if (missingSubjects) {
            toast.error("Please select a subject for all files.");
            return;
        }

        setIsUploading(true);
        try {
            const uploadPromises = files.map(async file => {
                return uploadFile({ file, path, subjectId: fileSubjects[file.name] })
                    .then((uploadedFile) => {
                        if (uploadedFile) {
                            toast.success(`Uploaded ${file.name}. AI is processing!`);
                            return true;
                        }
                        return false;
                    })
                    .catch((err: Error) => {
                        toast.error(err.message || `Failed to upload file ${file.name}`);
                        return false;
                    });
            });

            const results = await Promise.all(uploadPromises);
            const allSucceeded = results.every(res => res);

            if (allSucceeded) {
                setFiles([]);
                setFileSubjects({});
                setIsOpen(false);
            } else {
                setFiles(prev => prev.filter((_, idx) => !results[idx]));
                setFileSubjects(prev => {
                    const updated = { ...prev };
                    files.forEach((file, idx) => {
                        if (results[idx]) {
                            delete updated[file.name];
                        }
                    });
                    return updated;
                });
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("flex items-center", className)}>
            <Button
                type="button"
                onClick={() => {
                    if (subjectsList && subjectsList.length > 0) {
                        setIsOpen(true);
                    } else {
                        toast.error("Please create a subject first before uploading files.");
                    }
                }}
                className={cn(
                    "uploader-button py-6 px-7 rounded-full flex items-center gap-2 shadow-sm",
                    (!subjectsList || subjectsList.length === 0) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                )}
            >
                <Image
                    src="/assets/icons/upload.svg"
                    alt="upload"
                    width={24}
                    height={24}
                />
                <p className="font-medium">Upload</p>
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => !isUploading && setIsOpen(open)}>
                <DialogContent className="sm:max-w-[540px] p-6 rounded-3xl bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 shadow-2xl">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-xl font-bold text-dark100_light900 flex items-center gap-2.5">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                                <BookOpen className="h-5 w-5" />
                            </span>
                            Upload & Process Study Material
                        </DialogTitle>
                        <DialogDescription className="text-sm text-dark500_light400">
                            Choose an enrolled subject and drop your lecture slides, notes, or practice exams. AI will process them instantly.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-dark300_light700 flex items-center gap-1.5">
                                1. Upload Document <span className="text-destructive">*</span>
                            </label>
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[160px]",
                                    isDragActive
                                        ? "border-emerald-500 bg-emerald-500/10"
                                        : "border-light-800 dark:border-dark-400 bg-light-800/30 dark:bg-dark-300/30 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                                )}
                            >
                                <input {...getInputProps()} disabled={isUploading} />
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
                                    <Image src="/assets/icons/upload.svg" alt="upload icon" width={28} height={28} />
                                </div>
                                <p className="text-sm font-medium text-dark200_light800">
                                    Drag & drop your file here, or <span className="text-emerald-600 font-semibold underline">browse</span>
                                </p>
                                <p className="text-xs text-dark500_light400 mt-1">
                                    Supports Docs, Images, Audio, Video (Max size: 5MB)
                                </p>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-dark500_light400">
                                    Selected Files ({files.length})
                                </h4>
                                <ul className="space-y-2">
                                    {files.map((file: File, index) => {
                                        const { type, extension } = getFileType(file.name);
                                        return (
                                            <li
                                                key={`${file.name}-${index}`}
                                                className="flex flex-col gap-2.5 p-3 rounded-xl border border-light-800 dark:border-dark-400 bg-light-900 dark:bg-dark-300"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex flex-1 min-w-0 items-center gap-3 overflow-hidden">
                                                        <Thumbnail type={type} url={convertFileToUrl(file)} extension={extension} className="shrink-0" />
                                                        <div className="flex flex-col min-w-0 flex-1 w-full">
                                                            <p className="line-clamp-1 break-all text-sm font-medium text-dark200_light800">
                                                                {file.name}
                                                            </p>
                                                            <span className="text-xs text-dark500_light400">
                                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!isUploading && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleRemoveFile(e, file.name)}
                                                            className="p-1.5 rounded-full hover:bg-light-800 dark:hover:bg-dark-400 text-dark500_light400 transition cursor-pointer shrink-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="relative flex items-center w-full">
                                                    <select
                                                        className={cn("w-full h-9 px-3 rounded-lg border bg-light-900 dark:bg-dark-300 font-medium appearance-none outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-xs",
                                                            !fileSubjects[file.name] ? "text-dark500_light400 border-rose-300/60 dark:border-rose-500/30" : "text-dark200_light800 border-light-800 dark:border-dark-400"
                                                        )}
                                                        value={fileSubjects[file.name] || ""}
                                                        onChange={(e) => setFileSubjects(prev => ({ ...prev, [file.name]: e.target.value }))}
                                                        disabled={isUploading}
                                                    >
                                                        <option value="" disabled>Select subject...</option>
                                                        {subjectsList?.map((subject) => (
                                                            <option key={subject.id} value={subject.id}>
                                                                {subject.subjectName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-dark500_light400 pointer-events-none" />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-3 pt-4 border-t border-light-800 dark:border-dark-400">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isUploading}
                            className="rounded-xl px-5 cursor-pointer border-light-800 dark:border-dark-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUploadSubmit}
                            disabled={files.length === 0 || files.some(f => !fileSubjects[f.name]) || isUploading}
                            className="primary-gradient text-light-900 font-medium rounded-xl px-6 py-2.5 flex items-center gap-2 cursor-pointer"
                        >
                            {isUploading ? (
                                <>
                                    <Image src="/assets/icons/loader.svg" alt="loader" width={18} height={18} className="animate-spin" />
                                    <span>Processing ({files.length})...</span>
                                </>
                            ) : (
                                <span>Upload & Process</span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FileUploader;