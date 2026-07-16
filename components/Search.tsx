"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFiles } from "@/lib/actions/file.actions";
import { semanticSearch, SemanticSearchResponse, SemanticSearchResult } from "@/lib/actions/ai.actions";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { useDebounce } from "use-debounce";
import { File_ } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, FileText, BookOpen } from "lucide-react";
import ApryseViewer from "@/components/ApryseViewer";

interface Citation {
    source: string;
    content: string;
    relevance?: number;
    documentId?: string;
    DocumentId?: string;
    pageNumber?: number;
    PageNumber?: number;
    isHighlightable?: boolean;
}

const formatGluedText = (text: string) => {
    if (!text) return text;
    return text
        .replace(/([a-zA-Z])([.:;!?)])([A-Za-z0-9])/g, '$1$2 $3') // e.g., Response.2 -> Response. 2, core:1 -> core: 1
        .replace(/([0-9])([.:;!?)])([A-Za-z])/g, '$1$2 $3')       // e.g., 1.Luồng -> 1. Luồng
        .replace(/([a-z])([A-Z])/g, '$1 $2');                     // e.g., sáchcác (doesn't fix), but fixes sáchCác -> sách Các
};

const getSnippet = (text: string, query: string) => {
    if (!query) return text.length > 250 ? text.substring(0, 250) + "..." : text;
    const terms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (terms.length === 0) return text.length > 250 ? text.substring(0, 250) + "..." : text;

    let firstMatchIdx = -1;
    for (const term of terms) {
        const idx = text.toLowerCase().indexOf(term);
        if (idx !== -1 && (firstMatchIdx === -1 || idx < firstMatchIdx)) {
            firstMatchIdx = idx;
        }
    }

    if (firstMatchIdx !== -1) {
        const start = Math.max(0, firstMatchIdx - 80);
        const end = Math.min(text.length, firstMatchIdx + 160);
        return (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");
    }
    
    return text.substring(0, 250) + (text.length > 250 ? "..." : "");
};

const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    
    const terms = highlight.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (terms.length === 0) return <>{text}</>;

    const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <mark key={i} className="bg-brand/20 text-brand font-bold rounded-sm px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
};

const Search = () => {
    const [query, setQuery] = useState("");
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("query") || "";

    const [results, setResults] = useState<File_[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const [aiResult, setAiResult] = useState<SemanticSearchResponse | string | null>(null);
    const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

    const router = useRouter();
    const path = usePathname();
    const [debouncedQuery] = useDebounce(query, 300);
    const prevQueryRef = useRef(debouncedQuery);
    const isNavigating = useRef(false);

    useEffect(() => {
        const isNewTyping = prevQueryRef.current !== debouncedQuery;
        prevQueryRef.current = debouncedQuery;

        const fetchFiles = async () => {
            if (debouncedQuery.length === 0) {
                setResults([]);
                setDropdownOpen(false);

                if (searchParams.has("query")) {
                    const newSearchParams = new URLSearchParams(searchParams.toString());
                    newSearchParams.delete("query");

                    const newPath = newSearchParams.toString()
                        ? `${path}?${newSearchParams.toString()}`
                        : path;

                    return router.push(newPath);
                }
                return;
            }

            const files = await getFiles({ types: [], searchText: debouncedQuery });

            if (files) {
                setResults(files.documents);
                if (isNewTyping && !isModalOpen && !isNavigating.current) {
                    setDropdownOpen(true);
                }
            }
        };

        fetchFiles();
    }, [debouncedQuery, path, router, searchParams, isModalOpen]);

    useEffect(() => {
        if (!searchQuery) {
            setQuery("");
        }
    }, [searchQuery]);

    const handleAISearch = async (searchQueryText: string) => {
        if (!searchQueryText.trim()) return;

        setDropdownOpen(false);
        setIsModalOpen(true);
        setIsLoadingAI(true);
        setAiResult(null);

        try {
            const response: SemanticSearchResponse = await semanticSearch(searchQueryText);
            setAiResult(response);
        } catch (error: any) {
            console.error("AI Search Error:", error);
            setAiResult(error.message || "Sorry, I encountered an error searching inside your documents.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const navigateToTarget = (fileName: string, typeOrExt: string) => {
        isNavigating.current = true;
        setDropdownOpen(false);
        setIsModalOpen(false);
        setResults([]);
        setQuery(fileName);

        let routeName = "home/documents";
        const t = typeOrExt.toLowerCase();

        const mediaExts = ["mp4", "webm", "mov", "mp3", "wav", "m4a"];
        const imageExts = ["png", "jpg", "jpeg", "gif", "svg", "webp"];
        const docExts = ["pdf", "doc", "docx", "txt", "csv", "xls", "xlsx", "ppt", "pptx", "md", "json"];

        if (t === "video" || t === "audio" || t.includes("video/") || t.includes("audio/") || mediaExts.includes(t)) {
            routeName = "home/media";
        } else if (t === "image" || t.includes("image/") || imageExts.includes(t)) {
            routeName = "home/images";
        } else if (t === "document" || t.includes("application/") || t.includes("text/") || docExts.includes(t)) {
            routeName = "home/documents";
        }

        router.push(`/${routeName}?query=${fileName}`);
    };

    const handleClickItem = (file: File_) => {
        navigateToTarget(file.fileName, file.fileType || file.fileExtension || "");
    };

    const handleCitationClick = async (citation: Citation) => {
        let docId = citation.documentId || citation.DocumentId;
        
        // If the backend returns a missing or Guid.Empty DocumentId, try to look it up by filename
        if (!docId || docId === "00000000-0000-0000-0000-000000000000") {
            try {
                const files = await getFiles({ types: [], searchText: citation.source });
                if (files && files.documents && files.documents.length > 0) {
                    // Find exact match or just take the first one
                    const matchedFile = files.documents.find(f => f.fileName === citation.source) || files.documents[0];
                    docId = matchedFile.id;
                    // Update citation object so ApryseViewer gets the right ID
                    citation.documentId = docId;
                }
            } catch (error) {
                console.error("Failed to lookup document by name", error);
            }
        }

        if (docId && docId !== "00000000-0000-0000-0000-000000000000") {
            setActiveCitation(citation);
        } else {
            // Ultimate fallback if file cannot be found at all
            const ext = citation.source.split('.').pop() || "";
            navigateToTarget(citation.source, ext);
        }
    };

    return (
        <div className="search relative w-full max-w-md">
            <form onSubmit={(e) => { e.preventDefault(); handleAISearch(query); }} className="search-input-wrapper flex items-center relative">
                <Image
                    src="/assets/icons/search.svg"
                    alt="Search"
                    width={24}
                    height={24}
                />
                <Input
                    value={query}
                    placeholder="Search files or ask AI..."
                    className="search-input w-full"
                    onChange={(e) => {
                        isNavigating.current = false;
                        setQuery(e.target.value);
                    }}
                />

                {dropdownOpen && (
                    <ul className="search-result absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                        {query.trim().length > 0 && (
                            <li
                                onClick={() => handleAISearch(query)}
                                className="flex items-center gap-3 p-3 bg-brand-100/40 hover:bg-brand-100 text-brand font-medium cursor-pointer transition-colors border-b border-slate-100/80"
                            >
                                <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
                                <span className="text-sm line-clamp-1">Ask AI about &ldquo;{query}&rdquo;...</span>
                            </li>
                        )}

                        {results.length > 0 ? (
                            results.map((file) => (
                                <li
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                    key={file.id}
                                    onClick={() => handleClickItem(file)}
                                >
                                    <div className="flex items-center gap-4">
                                        <Thumbnail
                                            type={file.fileType}
                                            extension={file.fileExtension}
                                            url={file.fileLink}
                                            className="size-9 min-w-9"
                                        />
                                        <p className="subtitle-2 line-clamp-1 text-light-100">
                                            {file.fileName}
                                        </p>
                                    </div>

                                    <FormattedDateTime
                                        date={file.createdAt || ""}
                                        className="caption line-clamp-1 text-light-200"
                                    />
                                </li>
                            ))
                        ) : (
                            <p className="empty-result p-4 text-center text-xs text-slate-400">No matching filenames found</p>
                        )}
                    </ul>
                )}
            </form>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[700px] p-6 shad-dialog outline-none border-none">
                    <DialogHeader className="mb-4 pb-4 border-b border-light-200 flex flex-row items-center gap-2">
                        <Sparkles className="h-5 w-5 text-brand" />
                        <DialogTitle className="h2-bold text-dark-100">
                            Discovery Engine
                        </DialogTitle>
                    </DialogHeader>

                    <div className="min-h-[200px] flex flex-col">
                        {isLoadingAI ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12 text-light-200 flex-1">
                                <Loader2 className="h-10 w-10 animate-spin text-brand" />
                                <p className="subtitle-2">Scanning multi-tenant vector namespaces...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-light-400/10 p-4 rounded-xl border border-light-200 text-sm font-medium text-dark-200">
                                    <span className="text-light-200 mr-2 font-bold">Query:</span>
                                    {query}
                                </div>

                                <div className="max-h-[55vh] overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                    {typeof aiResult === 'string' ? (
                                        <div className="text-dark-100 body-2 leading-relaxed whitespace-pre-wrap px-1">
                                            {aiResult}
                                        </div>
                                    ) : (
                                        <>
                                            {aiResult?.results && aiResult.results.length > 0 ? (
                                                <div className="pt-2">
                                                    <h4 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-brand" />
                                                        Found {aiResult.count} matching segments
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {aiResult.results.map((res: SemanticSearchResult, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => handleCitationClick({
                                                                    source: res.fileName,
                                                                    content: res.content,
                                                                    documentId: res.documentId,
                                                                    pageNumber: res.pageNumber,
                                                                    isHighlightable: res.isHighlightable
                                                                })}
                                                                className={`rounded-xl p-4 border transition-all cursor-pointer group ${
                                                                    res.isHighlightable !== false 
                                                                        ? "bg-white border-light-200 hover:border-brand/40 hover:shadow-drop-2" 
                                                                        : "bg-purple-50/50 border-purple-100 hover:border-purple-300 hover:shadow-drop-2"
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                                            res.isHighlightable !== false ? "bg-brand/10 group-hover:bg-brand/20" : "bg-purple-100 group-hover:bg-purple-200"
                                                                        }`}>
                                                                            {res.isHighlightable !== false ? (
                                                                                <BookOpen className={`h-4 w-4 ${res.isHighlightable !== false ? "text-brand" : "text-purple-600"}`} />
                                                                            ) : (
                                                                                <Sparkles className="h-4 w-4 text-purple-600" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-dark-100 line-clamp-1 flex items-center gap-2" title={res.fileName}>
                                                                                {res.fileName}
                                                                                {res.isHighlightable === false && (
                                                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full uppercase tracking-wider">
                                                                                        AI SUMMARY
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                            {res.pageNumber ? (
                                                                                <p className={`text-xs ${res.isHighlightable !== false ? "text-light-200" : "text-purple-400"}`}>Page {res.pageNumber}</p>
                                                                            ) : res.isHighlightable !== false ? (
                                                                                <p className="text-xs text-light-200">Document Snippet</p>
                                                                            ) : (
                                                                                <p className="text-xs text-purple-400">Document Overview</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                                                                        res.isHighlightable !== false ? "bg-slate-100 dark:bg-dark-300" : "bg-purple-100/50"
                                                                    }`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                                            res.score > 0.7 ? "bg-emerald-500" :
                                                                            res.score > 0.4 ? "bg-amber-500" :
                                                                            "bg-slate-400"
                                                                        }`}></span>
                                                                        <span className="text-[10px] font-bold text-dark-200 uppercase tracking-wider">
                                                                            {(res.score * 100).toFixed(0)}% Match
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className={`text-sm mt-2 line-clamp-4 leading-relaxed p-3 rounded-lg border whitespace-pre-line ${
                                                                    res.isHighlightable !== false 
                                                                        ? "text-dark-200 bg-slate-50 border-slate-100" 
                                                                        : "text-purple-900 bg-white/60 border-purple-100/50"
                                                                }`} title={res.content}>
                                                                    {res.isHighlightable !== false ? (
                                                                        <HighlightedText text={getSnippet(formatGluedText(res.content), query)} highlight={query} />
                                                                    ) : (
                                                                        <span className="italic">{res.content}</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <p className="text-slate-500 body-2">No relevant documents found for your search.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!activeCitation} onOpenChange={(open) => !open && setActiveCitation(null)}>
                <DialogContent className="sm:max-w-[80vw] h-[85vh] p-0 overflow-hidden rounded-2xl flex flex-col bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                                <BookOpen className="h-4 w-4 text-brand" />
                            </div>
                            <span className="text-base font-bold text-slate-800 line-clamp-1">
                                {activeCitation?.source}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 w-full relative bg-slate-50">
                        {activeCitation && (
                            <ApryseViewer 
                                key={`${activeCitation.documentId || activeCitation.DocumentId}-${activeCitation.pageNumber || activeCitation.PageNumber}`}
                                file={{
                                    id: activeCitation.documentId || activeCitation.DocumentId || "",
                                    fileName: activeCitation.source,
                                    fileExtension: activeCitation.source.split('.').pop() || 'pdf',
                                    mimeType: "",
                                    fileSizeBytes: 0,
                                    uploadedAt: new Date().toISOString(),
                                    status: "Completed",
                                    lifecycleStatus: "Active",
                                    isEncrypted: false,
                                    isPublic: false,
                                    encryptionKeyId: "",
                                    ownerId: ""
                                }} 
                                path="/search" 
                                closeModals={() => setActiveCitation(null)} 
                                readOnly={true} 
                                targetPage={activeCitation.pageNumber || activeCitation.PageNumber || 1}
                                searchSnippet={activeCitation.isHighlightable === false ? undefined : formatGluedText(activeCitation.content)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Search;