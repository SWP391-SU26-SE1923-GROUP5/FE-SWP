"use client"

import { useEffect, useRef, useState } from "react";
import { File_ } from "@/types";
import { downloadFile, updateEditedFile } from "@/lib/actions/file.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, FileText, Shield, Pencil } from "lucide-react";

interface ApryseDocument {
    getFileData: (options: { xfdfString: string; downloadType: string }) => Promise<ArrayBuffer>;
}

interface ApryseUI {
    setCurrentPageNumber: (pageNum: number) => void;
    searchTextFull: (snippet: string) => void;
    disableElements: (elements: string[]) => void;
    dispose: () => void;
}

interface ApryseCore {
    documentViewer: {
        addEventListener: (event: string, callback: () => void) => void;
        setCurrentPage: (pageNum: number, smooth: boolean) => void;
        getDocument: () => ApryseDocument;
    };
    annotationManager: {
        exportAnnotations: () => Promise<string>;
    };
}

export interface WebViewerInstance {
    UI: ApryseUI;
    Core: ApryseCore;
}

export default function ApryseViewer({ file, path, closeModals, readOnly = false, targetPage, searchSnippet }: { file: File_, path: string, closeModals: () => void, readOnly?: boolean, targetPage?: number, searchSnippet?: string }) {
    const viewer = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const instanceRef = useRef<WebViewerInstance | "initializing" | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!instanceRef.current || instanceRef.current === "initializing") return;
        
        try {
            const instance = instanceRef.current as WebViewerInstance;
            if (targetPage !== undefined && targetPage !== null) {
                let pageNum = parseInt(targetPage.toString(), 10);
                if (pageNum === 0) pageNum = 1; // Backend might return 0-based indexing
                if (!isNaN(pageNum) && pageNum > 0) {
                    instance.UI.setCurrentPageNumber(pageNum);
                }
            }
            if (searchSnippet) {
                instance.UI.searchTextFull(searchSnippet);
            }
        } catch (error) {
            console.error("Error jumping to citation:", error);
        }
    }, [targetPage, searchSnippet]);

    const ext = file.fileExtension?.toLowerCase().replace('.', '') || "";

    useEffect(() => {
        let isMounted = true;
        if (instanceRef.current) return;
        instanceRef.current = "initializing";

        downloadFile({ fileId: file.id })
            .then((result) => {
                if (!isMounted) return;
                const binaryString = window.atob(result.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const blob = new Blob([bytes], { type: 'application/octet-stream' });
                blobUrlRef.current = window.URL.createObjectURL(blob);

                return import('@pdftron/webviewer');
            })
            .then((webviewerModule) => {
                if (!isMounted || !webviewerModule) return;
                const WebViewer = webviewerModule.default;
                const isSpreadsheet = ["xlsx", "xls"].includes(ext);

                if (viewer.current) {
                    const options: Record<string, unknown> = {
                        path: '/lib/webviewer',
                        initialDoc: blobUrlRef.current ?? "",
                        extension: ext,
                        enableOfficeEditing: !readOnly,
                        isReadOnly: readOnly,
                        licenseKey: "demo:1782432031639:63f292a203000000006bfbfd2dedd818a75a9704b35fedfc1b98df0080",
                    };
                    
                    if (isSpreadsheet && !readOnly) {
                        options.initialMode = 'spreadsheetEditor';
                        options.spreadsheetEditorOptions = { initialEditMode: 'editing' };
                    }

                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    WebViewer(options, viewer.current).then((instance: WebViewerInstance) => {
                        if (!isMounted) {
                            instance.UI.dispose();
                            return;
                        }
                        instanceRef.current = instance;
                        if (readOnly) {
                            instance.UI.disableElements(['annotationToolbarButton', 'toolsHeader', 'saveButton']);
                        }
                        
                        instance.Core.documentViewer.addEventListener('documentLoaded', () => {
                            if (targetPage !== undefined && targetPage !== null) {
                                let pageNum = parseInt(targetPage.toString(), 10);
                                if (pageNum === 0) pageNum = 1;
                                if (!isNaN(pageNum) && pageNum > 0) {
                                    instance.Core.documentViewer.setCurrentPage(pageNum, true);
                                }
                            }
                            if (searchSnippet) {
                                instance.UI.searchTextFull(searchSnippet);
                            }
                        });
                    });
                }
            })
            .catch((error) => {
                console.error("Failed to load document:", error);
                if (isMounted) toast.error("Failed to load document for editing.");
            });

        return () => {
            isMounted = false;
            if (blobUrlRef.current) window.URL.revokeObjectURL(blobUrlRef.current);
            if (instanceRef.current && instanceRef.current !== "initializing") {
                (instanceRef.current as WebViewerInstance).UI.dispose();
            }
            instanceRef.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const handleSave = async () => {
        if (!instanceRef.current || instanceRef.current === "initializing") return;

        setIsSaving(true);
        const toastId = toast.loading("Saving document changes...");

        try {
            const core = instanceRef.current as WebViewerInstance;
            const doc = core.Core.documentViewer.getDocument();

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

            toast.success("Document saved successfully!", { id: toastId });
            closeModals();
        } catch (error) {
            console.error("Failed to save document:", error);
            toast.error("Failed to save document changes.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (readOnly) {
        return (
            <div className="flex flex-col w-full gap-0">
                <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/80 rounded-t-xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 bg-white rounded-lg shadow-2xs border border-slate-200/60">
                            <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 truncate max-w-[300px]">{file.fileName}</p>
                    </div>
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5 shadow-2xs shrink-0">
                        <Shield className="w-3 h-3" />
                        Read-Only
                    </span>
                </div>
                <div className="relative w-full h-[72vh] bg-white border border-t-0 border-slate-200/80 rounded-b-xl overflow-hidden">
                    <div ref={viewer} className="w-full h-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full gap-0">
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-brand/5 via-indigo-50/50 to-slate-50 border border-slate-200/80 rounded-t-xl">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 bg-white rounded-lg shadow-2xs border border-brand/20">
                        <Pencil className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[280px]">{file.fileName}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{ext.toUpperCase()} · Editing Mode</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand to-indigo-600 hover:from-brand/90 hover:to-indigo-600/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer h-9"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving…
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="relative w-full h-[75vh] rounded-b-xl overflow-hidden border border-t-0 border-slate-200/80 bg-white">
                {isSaving && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm gap-3">
                        <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                        <p className="font-semibold text-slate-700 text-sm">Saving your changes…</p>
                        <p className="text-xs text-slate-400">Please don&#39;t close this window</p>
                    </div>
                )}
                <div ref={viewer} className="w-full h-full"></div>
            </div>
        </div>
    );
}
