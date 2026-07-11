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

interface FileUploaderProps {
    subjects?: Subject[];
    className?: string;
}

const FileUploader = ({ subjects: initialSubjects = [], className }: FileUploaderProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);
    const [subjectsList, setSubjectsList] = useState<Subject[]>(initialSubjects);
    const path = usePathname();

    React.useEffect(() => {
        if (initialSubjects && initialSubjects.length > 0) {
            setSubjectsList(initialSubjects);
        }
    }, [initialSubjects]);

    React.useEffect(() => {
        if (isOpen && (!subjectsList || subjectsList.length === 0)) {
            getSubjects()
                .then(res => {
                    if (res && Array.isArray(res)) setSubjectsList(res);
                })
                .catch(err => console.error("Failed to load fallback subjects inside modal:", err));
        }
    }, [isOpen, subjectsList]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const validFiles = acceptedFiles.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} exceeds maximum file size of 50MB.`);
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
    };

    const handleUploadSubmit = async () => {
        if (!selectedSubjectId) {
            toast.error("Please select a subject before uploading.");
            return;
        }
        if (files.length === 0) {
            toast.error("Please select at least one file to upload.");
            return;
        }

        setIsUploading(true);
        try {
            const uploadPromises = files.map(async file => {
                return uploadFile({ file, path, subjectId: selectedSubjectId })
                    .then((uploadedFile) => {
                        if (uploadedFile) {
                            toast.success(`Uploaded ${file.name}. AI is processing!`);
                            return true;
                        }
                        return false;
                    })
                    .catch((err: any) => {
                        toast.error(err.message || `Failed to upload file ${file.name}`);
                        return false;
                    });
            });

            const results = await Promise.all(uploadPromises);
            const allSucceeded = results.every(res => res);

            if (allSucceeded) {
                setFiles([]);
                setIsOpen(false);
            } else {
                setFiles(prev => prev.filter((_, idx) => !results[idx]));
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={cn("flex items-center", className)}>
            <Button
                type="button"
                onClick={() => setIsOpen(true)}
                className="uploader-button py-6 px-7 rounded-full cursor-pointer flex items-center gap-2 shadow-sm"
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
                                1. Select Subject <span className="text-destructive">*</span>
                            </label>
                            <div className="relative flex items-center">
                                <select
                                    className="w-full h-12 px-4 rounded-xl border border-light-800 dark:border-dark-400 bg-light-900 dark:bg-dark-300 text-dark300_light700 font-medium appearance-none outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer text-sm"
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    disabled={isUploading}
                                >
                                    <option value="" disabled>Choose an existing subject...</option>
                                    {subjectsList?.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.subjectName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 w-4 h-4 text-dark500_light400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-dark300_light700 flex items-center gap-1.5">
                                2. Upload Document <span className="text-destructive">*</span>
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
                                    Supports PDF, DOCX, PPTX (Max size: 50MB)
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
                                                className="flex items-center justify-between p-3 rounded-xl border border-light-800 dark:border-dark-400 bg-light-900 dark:bg-dark-300"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Thumbnail type={type} url={convertFileToUrl(file)} extension={extension} />
                                                    <div className="truncate text-sm font-medium text-dark200_light800">
                                                        {file.name}
                                                        <span className="block text-xs text-dark500_light400">
                                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                        </span>
                                                    </div>
                                                </div>
                                                {!isUploading && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleRemoveFile(e, file.name)}
                                                        className="p-1.5 rounded-full hover:bg-light-800 dark:hover:bg-dark-400 text-dark500_light400 transition cursor-pointer"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
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
                            disabled={!selectedSubjectId || files.length === 0 || isUploading}
                            className="primary-gradient text-light-900 font-medium rounded-xl px-6 py-2.5 flex items-center gap-2 cursor-pointer"
                        >
                            {isUploading ? (
                                <>
                                    <Image src="/assets/icons/loader.svg" alt="loader" width={18} height={18} className="animate-spin" />
                                    <span>AI Processing ({files.length})...</span>
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