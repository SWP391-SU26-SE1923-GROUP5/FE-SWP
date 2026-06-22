"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFiles } from "@/lib/actions/file.actions";
import { semanticSearch } from "@/lib/actions/ai.actions";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { useDebounce } from "use-debounce";
import { File_ } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, FileText } from "lucide-react";

interface Citation {
    source: string;
    content: string;
    relevance: number;
}

interface SemanticSearchResponse {
    answer: string;
    citations: Citation[];
    confidence: number;
}

const Search = () => {
    const [query, setQuery] = useState("");
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("query") || "";

    const [results, setResults] = useState<File_[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const [aiResult, setAiResult] = useState<SemanticSearchResponse | string | null>(null);

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

    // Shared navigation logic for both standard search clicks and AI citation clicks
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

    const handleCitationClick = (source: string) => {
        // Extract the extension from the source file name (e.g. "report.pdf" -> "pdf")
        const ext = source.split('.').pop() || "";
        navigateToTarget(source, ext);
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
                                    <div className="text-dark-100 body-2 leading-relaxed whitespace-pre-wrap px-1">
                                        {typeof aiResult === 'string' ? aiResult : aiResult?.answer}
                                    </div>

                                    {typeof aiResult !== 'string' && aiResult?.citations && aiResult.citations.length > 0 && (
                                        <div className="border-t border-slate-100 pt-5 mt-4">
                                            <h4 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Sources
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {aiResult.citations.map((citation, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleCitationClick(citation.source)}
                                                        className="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-slate-100 transition-colors cursor-pointer"
                                                    >
                                                        <p className="text-sm font-medium text-brand line-clamp-1" title={citation.source}>
                                                            {citation.source}
                                                        </p>
                                                        {citation.content && (
                                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2" title={citation.content}>
                                                                {citation.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Search;