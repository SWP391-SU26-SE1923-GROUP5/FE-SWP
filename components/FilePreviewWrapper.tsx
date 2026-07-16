"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { File_ } from "@/types";
import { previewFile, downloadFile } from "@/lib/actions/file.actions";
import Thumbnail from "@/components/Thumbnail";
import ApryseViewer from "@/components/ApryseViewer";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  file: File_;
  children: React.ReactNode;
  className?: string;
}

const getMimeType = (ext: string, fallback?: string) => {
  switch (ext) {
    case "pdf": return "application/pdf";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    default: return (fallback && fallback.includes("/")) ? fallback : "application/octet-stream";
  }
};

const base64ToBlobUrl = (base64: string, mimeType: string) => {
  try {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return window.URL.createObjectURL(blob);
  } catch (err) {
    console.error("Blob conversion error:", err);
    return `data:${mimeType};base64,${base64}`;
  }
};

export default function FilePreviewWrapper({ file, children, className = "" }: Props) {
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [realDocUrl, setRealDocUrl] = useState<string | null>(null);
  const [isLoadingRealDoc, setIsLoadingRealDoc] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewBlobRef = useRef<string | null>(null);
  const realBlobRef = useRef<string | null>(null);

  const fileExt = file.fileExtension?.toLowerCase().replace(".", "") || "";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(fileExt) || file.fileType === "image";
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(fileExt) || file.fileType === "video";
  const isAudio = ["mp3", "wav", "ogg", "aac", "m4a"].includes(fileExt) || file.fileType === "audio";
  const isPdf = fileExt === "pdf";
  const isOffice = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(fileExt);

  useEffect(() => {
    return () => {
      if (previewBlobRef.current && previewBlobRef.current.startsWith("blob:")) {
        window.URL.revokeObjectURL(previewBlobRef.current);
      }
      if (realBlobRef.current && realBlobRef.current.startsWith("blob:")) {
        window.URL.revokeObjectURL(realBlobRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      if (!previewUrl && !isOffice) {
        setIsLoadingPreview(true);
        previewFile({ fileId: file.id })
          .then((res) => {
            if (res?.data) {
              const mime = getMimeType(fileExt, res.contentType || file.fileType);
              const url = base64ToBlobUrl(res.data, mime);
              previewBlobRef.current = url;
              setPreviewUrl(url);
            }
          })
          .catch((err) => console.error("Preview document fetch failed", err))
          .finally(() => setIsLoadingPreview(false));
      }
    }, 250);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const handleOpenRealDoc = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menuitem"], [role="button"], button, .shad-no-focus')) {
      return;
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
    setIsOpen(true);

    if (!realDocUrl && !isOffice && !isPdf) {
      setIsLoadingRealDoc(true);
      try {
        const res = await downloadFile({ fileId: file.id });
        if (res?.data) {
          const mime = getMimeType(fileExt, res.contentType || file.fileType);
          const url = base64ToBlobUrl(res.data, mime);
          realBlobRef.current = url;
          setRealDocUrl(url);
        }
      } catch (error) {
        console.error("Failed to load real document:", error);
        toast.error("Could not load real document.");
      } finally {
        setIsLoadingRealDoc(false);
      }
    }
  };

  return (
    <>
      <div
        onClick={handleOpenRealDoc}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative cursor-pointer group select-none transition-all duration-200 ${className}`}
      >
        {children}

        {isHovered && (
          <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-3 w-80 h-80 p-2 bg-white rounded-2xl shadow-drop-3 border border-light-700 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500 w-full h-full bg-slate-50 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
                <span className="text-xs font-semibold">Loading document preview...</span>
              </div>
            ) : previewUrl ? (
              isImage ? (
                <img src={previewUrl} alt={file.fileName} className="w-full h-full object-contain rounded-xl bg-slate-50" />
              ) : isVideo ? (
                <video src={previewUrl} muted autoPlay loop className="w-full h-full object-cover rounded-xl bg-black" />
              ) : isAudio ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-xl p-4">
                  <Thumbnail type="audio" extension={fileExt} url={file.fileLink} className="!size-16" />
                  <span className="text-xs font-bold text-dark-200 text-center line-clamp-2">{file.fileName}</span>
                </div>
              ) : (
                <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 rounded-xl bg-white pointer-events-none" />
              )
            ) : isOffice ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-xl p-4">
                <Thumbnail type={file.fileType} extension={fileExt} url={file.fileLink} className="!size-16" />
                <span className="text-xs font-bold text-dark-200 text-center line-clamp-2">{file.fileName}</span>
                <span className="text-[10px] text-[#10b981] font-semibold">Click to view full real document</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400 w-full h-full bg-slate-50 rounded-xl">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <span className="text-xs font-semibold">Preview unavailable</span>
              </div>
            )}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white drop-shadow-sm" />
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl! w-full max-h-[90vh] p-6 overflow-hidden flex flex-col select-none">
          <DialogHeader className="mb-2 pb-3 border-b border-light-700 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-dark-200 text-lg font-bold truncate">
              <Thumbnail type={file.fileType} extension={fileExt} url={file.fileLink} className="!size-8 shrink-0" />
              <span className="truncate">{file.fileName}</span>
            </DialogTitle>
            <div className="flex items-center gap-2 mr-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#10b981] border border-emerald-200 flex items-center gap-1.5 shadow-drop-3">
                <Shield className="w-3.5 h-3.5" /> Strictly Read-Only View
              </span>
            </div>
          </DialogHeader>

          <div className="border border-light-700 rounded-xl overflow-hidden h-[72vh] w-full relative flex flex-col items-center justify-center bg-slate-50/50">
            {isLoadingRealDoc ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-[#10b981]" />
                <p className="text-sm font-medium">Loading real document from server...</p>
              </div>
            ) : (isOffice || isPdf) ? (
              <div className="w-full h-[72vh]">
                <ApryseViewer file={file} path={path || ""} closeModals={() => setIsOpen(false)} readOnly={true} />
              </div>
            ) : realDocUrl ? (
              isImage ? (
                <img
                  src={realDocUrl}
                  alt={file.fileName}
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-h-[72vh] max-w-full object-contain mx-auto rounded-lg shadow-sm pointer-events-none"
                />
              ) : isVideo ? (
                <video
                  src={realDocUrl}
                  controls
                  controlsList="nodownload"
                  autoPlay
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-h-[72vh] w-full rounded-lg bg-black" />
              ) : isAudio ? (
                <div className="p-12 flex flex-col items-center justify-center gap-6 w-full max-w-md">
                  <Thumbnail type="audio" extension={fileExt} url={file.fileLink} className="!size-20" />
                  <audio src={realDocUrl} controls controlsList="nodownload" autoPlay className="w-full shadow-sm" />
                </div>
              ) : isPdf ? (
                <iframe src={`${realDocUrl}#toolbar=0`} className="w-full h-[72vh] border-0 rounded-lg" />
              ) : (
                <p className="text-slate-500 text-sm">Real document loaded.</p>
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <p className="text-sm font-medium">Could not display real document.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
