"use client"

import { useEffect, useRef, useState } from "react";
import { File_ } from "@/types";
import { downloadFile, updateEditedFile } from "@/lib/actions/file.actions";
import { Button } from "@/components/ui/button";

export default function ApryseViewer({ file, path, closeModals }: { file: File_, path: string, closeModals: () => void }) {
    const viewer = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const instanceRef = useRef<any>(null);
    const blobUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (instanceRef.current) return;
        instanceRef.current = "initializing";

        const loadDocument = async () => {
            try {
                const result = await downloadFile({ fileId: file.id });

                const binaryString = window.atob(result.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const blob = new Blob([bytes], { type: 'application/octet-stream' });
                blobUrlRef.current = window.URL.createObjectURL(blob);

                import('@pdftron/webviewer').then((webviewerModule) => {
                    const WebViewer = webviewerModule.default;
                    const ext = file.fileExtension?.toLowerCase().replace('.', '') || "";
                    const isSpreadsheet = ["xlsx", "xls"].includes(ext);

                    if (viewer.current) {
                        WebViewer(
                            {
                                path: '/lib/webviewer',
                                initialDoc: blobUrlRef.current ?? "",
                                extension: ext,
                                enableOfficeEditing: true,
                                ...(isSpreadsheet && {
                                    initialMode: 'spreadsheetEditor',
                                    spreadsheetEditorOptions: {
                                        initialEditMode: 'editing'
                                    }
                                })
                            },
                            viewer.current
                        ).then((instance) => {
                            instanceRef.current = instance;
                        });
                    }
                });
            } catch (error) {
                console.error("Failed to load document:", error);
            }
        };

        loadDocument();

        return () => {
            if (blobUrlRef.current) window.URL.revokeObjectURL(blobUrlRef.current);
            if (instanceRef.current && instanceRef.current !== "initializing") {
                instanceRef.current.UI.dispose();
                instanceRef.current = null;
            }
        }
    }, [file, path]);

    const handleSave = async () => {
        if (!instanceRef.current || instanceRef.current === "initializing") return;
        setIsSaving(true);

        try {
            const core = instanceRef.current;
            const doc = core.Core.documentViewer.getDocument();

            const ext = file.fileExtension?.toLowerCase().replace('.', '') || '';
            const isOfficeFile = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(ext);

            const xfdfString = await core.Core.annotationManager.exportAnnotations();

            const data = await doc.getFileData({
                xfdfString,
                downloadType: isOfficeFile ? 'office' : 'pdf'
            });
            const arr = new Uint8Array(data);

            let mimeType = 'application/pdf';
            if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            const blob = new Blob([arr], { type: mimeType });
            const editedFile = new File([blob], file.fileName, { type: mimeType });

            await updateEditedFile({
                fileId: file.id,
                file: editedFile,
                path
            });

            closeModals();
        } catch (error) {
            console.error("Failed to save document:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <p className="font-semibold text-dark-100 truncate max-w-[300px]">{file.fileName}</p>
                    <p className="text-xs text-light-200">Powered by Apryse Premium</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-brand hover:bg-brand-100 text-white rounded-full cursor-pointer">
                    {isSaving ? "Saving..." : "Save file 💾"}
                </Button>
            </div>

            <div className="relative w-full h-[75vh] rounded-md overflow-hidden border bg-white shadow-sm">
                {isSaving && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                        <p className="animate-pulse font-semibold text-brand text-lg">Saving changes...</p>
                    </div>
                )}
                <div ref={viewer} className="w-full h-full"></div>
            </div>
        </div>
    );
}