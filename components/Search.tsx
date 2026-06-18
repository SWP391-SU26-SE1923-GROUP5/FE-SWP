"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFiles } from "@/lib/actions/file.actions";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { useDebounce } from "use-debounce";
import { File_ } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";

const Search = () => {
    const [query, setQuery] = useState("");
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("query") || "";

    const [results, setResults] = useState<File_[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);

    const router = useRouter();
    const path = usePathname();
    const [debouncedQuery] = useDebounce(query, 300);
    const prevQueryRef = useRef(debouncedQuery);

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
                if (isNewTyping && !isModalOpen) {
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
            const response = await fetch('/api/ai/retrieval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userQuestion: searchQueryText })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to query vector store.");

            setAiResult(data.answer);
        } catch (error: any) {
            console.error("AI Search Error:", error);
            setAiResult("Sorry, I encountered an error searching inside your documents.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleClickItem = (file: File_) => {
        setDropdownOpen(false);
        setResults([]);

        let routeName = "documents";
        const type = file.fileType?.toLowerCase() || "";

        if (type === "video" || type === "audio" || type.includes("video/") || type.includes("audio/")) {
            routeName = "home/media";
        } else if (type === "image" || type.includes("image/")) {
            routeName = "home/images";
        } else if (type === "document" || type.includes("application/")) {
            routeName = "home/documents";
        } else {
            routeName = `${type}s`;
        }

        router.push(`/${routeName}?query=${query}`);
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
                    onChange={(e) => setQuery(e.target.value)}
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
                                        date={file.createdAt}
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
                <DialogContent className="sm:max-w-[600px] p-6 shad-dialog outline-none border-none">
                    <DialogHeader className="mb-4 pb-4 border-b border-light-200 flex flex-row items-center gap-2">
                        <Sparkles className="h-5 w-5 text-brand" />
                        <DialogTitle className="h2-bold text-dark-100">
                            Discovery Engine
                        </DialogTitle>
                    </DialogHeader>

                    <div className="min-h-[200px] flex flex-col justify-center">
                        {isLoadingAI ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-8 text-light-200">
                                <Loader2 className="h-10 w-10 animate-spin text-brand" />
                                <p className="subtitle-2">Scanning multi-tenant vector namespaces...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-light-400/10 p-4 rounded-xl border border-light-200 text-sm font-medium text-dark-200">
                                    <span className="text-light-200 mr-2 font-bold">Query:</span>
                                    {query}
                                </div>
                                <div className="text-dark-100 body-2 leading-relaxed whitespace-pre-wrap px-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    {aiResult}
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