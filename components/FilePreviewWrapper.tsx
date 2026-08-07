"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { File_ } from "@/types";
import { getFileType } from "@/lib/utils";
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
  const [previewPosition, setPreviewPosition] = useState<"above" | "below" | "right">("above");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [realDocUrl, setRealDocUrl] = useState<string | null>(null);
  const [isLoadingRealDoc, setIsLoadingRealDoc] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewBlobRef = useRef<string | null>(null);
  const realBlobRef = useRef<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const { type: computedType, extension: computedExt } = getFileType(file.fileName);
  const fileExt = computedExt || "";
  const isImage = computedType === "image";
  const isVideo = computedType === "video";
  const isAudio = computedType === "audio";
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

  const computePreviewPosition = () => {
    if (!cardRef.current) return "above" as const;
    const rect = cardRef.current.getBoundingClientRect();
    const previewH = 280;
    const previewW = 300;
    const gap = 12;

    // Prefer below if there's space
    if (rect.bottom + gap + previewH < window.innerHeight) return "below" as const;
    // Then try above
    if (rect.top - gap - previewH > 0) return "above" as const;
    // Fallback: show to the right
    if (rect.right + gap + previewW < window.innerWidth) return "right" as const;
    // Last resort: below anyway
    return "below" as const;
  };

  const handleMouseEnter = () => {
      hoverTimeoutRef.current = setTimeout(() => {
        setPreviewPosition(computePreviewPosition());
        setIsHovered(true);
        if (!previewUrl && !isOffice) {
          setPreviewUrl(`/api/files/${file.id}/preview`);
        }
      }, 300);
    };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const handleOpenRealDoc = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[role="menuitem"], [role="menu"], [role="dialog"], [role="button"], button, .shad-no-focus')) {
      return;
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
    setIsOpen(true);

    if (!realDocUrl && !isOffice && !isPdf) {
      setRealDocUrl(`/api/files/${file.id}/download`);
    }
  };

  const positionClasses = {
    above: "bottom-full left-1/2 -translate-x-1/2",
    below: "top-full left-1/2 -translate-x-1/2",
    right: "left-full top-0",
  };

  const bridgePadding = {
    above: "pb-3",
    below: "pt-3",
    right: "pl-3",
  };

  const arrowClasses = {
    above: "absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white",
    below: "absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white",
    right: "absolute right-full top-6 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-white",
  };

  const slideAnim = {
    above: "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
    below: "animate-in fade-in-0 slide-in-from-top-2 duration-200",
    right: "animate-in fade-in-0 slide-in-from-left-2 duration-200",
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleOpenRealDoc}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative cursor-pointer group select-none transition-all duration-200 ${className}`}
      >
        {children}

        {isHovered && (
          <div
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className={`absolute z-50 ${positionClasses[previewPosition]} ${bridgePadding[previewPosition]}`}
          >
            <div className={`w-[300px] h-[280px] p-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col items-center justify-center overflow-hidden relative ${slideAnim[previewPosition]}`}>
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center gap-2.5 text-slate-500 w-full h-full bg-slate-50/80 rounded-xl">
                  <Loader2 className="w-7 h-7 animate-spin text-brand" />
                  <span className="text-[11px] font-semibold text-slate-500">Loading preview…</span>
                </div>
              ) : previewUrl ? (
                isImage ? (
                  <img src={previewUrl} alt={file.fileName} className="w-full h-full object-contain rounded-xl bg-slate-50" />
                ) : isVideo ? (
                  <video src={previewUrl} muted autoPlay loop className="w-full h-full object-cover rounded-xl bg-black" />
                ) : isAudio ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-xl p-4">
                    <Thumbnail type="audio" extension={fileExt} url={file.fileLink} className="!size-14" />
                    <span className="text-xs font-bold text-dark-200 text-center line-clamp-2">{file.fileName}</span>
                  </div>
                ) : (
                  <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 rounded-xl bg-white pointer-events-none" />
                )
              ) : isOffice ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-xl p-4">
                  <Thumbnail type={computedType} extension={fileExt} url={file.fileLink} className="!size-14" />
                  <span className="text-xs font-bold text-dark-200 text-center line-clamp-2">{file.fileName}</span>
                  <span className="text-[10px] text-brand font-semibold">Click to open document</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 w-full h-full bg-slate-50 rounded-xl">
                  <AlertCircle className="w-7 h-7 text-amber-400" />
                  <span className="text-[11px] font-semibold">Preview unavailable</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-5xl! w-full max-h-[90vh] p-6 overflow-y-auto custom-scrollbar flex flex-col select-none">
          <DialogHeader className="mb-2 pb-3 border-b border-light-700 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-dark-200 text-lg font-bold truncate min-w-0 flex-1">
              <Thumbnail type={computedType} extension={fileExt} url={file.fileLink} className="!size-8 shrink-0" />
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
              ) : (
                <iframe src={`${realDocUrl}#toolbar=0`} className="w-full h-[72vh] border-0 rounded-lg bg-white" />
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
