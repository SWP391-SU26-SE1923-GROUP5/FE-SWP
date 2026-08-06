"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Layers, ArrowLeft, Sparkles, Clock, Award, BrainCircuit, Search, ArrowUpDown, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play, Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseAsUTC, formatDateGMT7 } from "@/lib/utils";
import { deleteFlashcardDeck } from "@/lib/actions/ai.actions";
import { toast } from "sonner";

export type DashboardCard = {
    front?: string;
    back?: string;
    createdAt?: string;
};

export type DashboardStats = {
    totalReviewed?: number;
    masteredCount?: number;
    averageEaseFactor?: number;
};

export type DeckItem = {
    deckId: string;
    deckTitle: string;
    documentId: string;
    documentName: string;
    cards: DashboardCard[];
    createdAt?: string;
};

type Props = {
    initialDecks: DeckItem[];
    actualDueCount: number;
    stats: DashboardStats | null;
};

export default function FlashcardsDashboardClient({ initialDecks, actualDueCount, stats }: Props) {
    const [decks, setDecks] = useState<DeckItem[]>(initialDecks);
    const [searchQuery, setSearchQuery] = useState("");
    const [sizeFilter, setSizeFilter] = useState<"all" | "small" | "medium" | "large">("all");
    const [sortBy, setSortBy] = useState<"most-cards" | "fewest-cards" | "name-asc" | "name-desc" | "newest" | "oldest">("most-cards");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(9);
    const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

    const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this deck? This action cannot be undone.")) {
            return;
        }

        setDeletingDeckId(deckId);
        const toastId = toast.loading("Deleting deck...");

        try {
            await deleteFlashcardDeck(deckId);
            setDecks((prev) => prev.filter((d) => d.deckId !== deckId));
            toast.success("Deck deleted successfully!", { id: toastId });
        } catch (error) {
            toast.error("Failed to delete deck.", { id: toastId });
        } finally {
            setDeletingDeckId(null);
        }
    };

    const groupedDocuments = useMemo(() => {
        const map = new Map<string, { documentId: string; documentName: string; decks: DeckItem[]; totalCards: number }>();
        decks.forEach(deck => {
            if (!map.has(deck.documentId)) {
                map.set(deck.documentId, {
                    documentId: deck.documentId,
                    documentName: deck.documentName,
                    decks: [],
                    totalCards: 0
                });
            }
            const entry = map.get(deck.documentId)!;
            entry.decks.push(deck);
            entry.totalCards += deck.cards.length;
        });
        return Array.from(map.values()).sort((a, b) => a.documentName.localeCompare(b.documentName));
    }, [decks]);

    const filteredAndSortedDecks = useMemo(() => {
        let result = [...decks];

        if (selectedDocumentId && !searchQuery.trim()) {
            result = result.filter(deck => deck.documentId === selectedDocumentId);
        }

        if (searchQuery.trim()) {
            // When searching, clear the selected document to search globally across all decks
            if (selectedDocumentId) setSelectedDocumentId(null);
            
            const query = searchQuery.toLowerCase();
            result = result.filter((deck) => {
                if (deck.documentName.toLowerCase().includes(query)) return true;
                if (deck.deckTitle.toLowerCase().includes(query)) return true;
                return deck.cards.some((c: DashboardCard) => 
                    (c.front && c.front.toLowerCase().includes(query)) ||
                    (c.back && c.back.toLowerCase().includes(query))
                );
            });
        }

        if (sizeFilter !== "all") {
            result = result.filter((deck) => {
                const count = deck.cards.length;
                if (sizeFilter === "small") return count >= 1 && count <= 10;
                if (sizeFilter === "medium") return count >= 11 && count <= 30;
                if (sizeFilter === "large") return count > 30;
                return true;
            });
        }

        result.sort((a, b) => {
            if (sortBy === "most-cards") {
                return b.cards.length - a.cards.length;
            } else if (sortBy === "fewest-cards") {
                return a.cards.length - b.cards.length;
            } else if (sortBy === "name-asc") {
                const docCmp = a.documentName.localeCompare(b.documentName);
                if (docCmp !== 0) return docCmp;
                return a.deckTitle.localeCompare(b.deckTitle);
            } else if (sortBy === "name-desc") {
                const docCmp = b.documentName.localeCompare(a.documentName);
                if (docCmp !== 0) return docCmp;
                return b.deckTitle.localeCompare(a.deckTitle);
            } else if (sortBy === "newest" || sortBy === "oldest") {
                const getLatestDate = (d: DeckItem) => {
                    if (d.createdAt) return parseAsUTC(d.createdAt).getTime();
                    if (d.cards.length > 0 && d.cards[0].createdAt) {
                        return Math.max(...d.cards.map((c: DashboardCard) => parseAsUTC(c.createdAt || undefined).getTime()));
                    }
                    return 0;
                };
                const timeA = getLatestDate(a);
                const timeB = getLatestDate(b);
                return sortBy === "newest" ? timeB - timeA : timeA - timeB;
            }
            return 0;
        });

        return result;
    }, [decks, searchQuery, sizeFilter, sortBy, selectedDocumentId]);

    const isDocumentView = !selectedDocumentId && !searchQuery.trim();
    const totalItems = isDocumentView ? groupedDocuments.length : filteredAndSortedDecks.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const activePage = Math.min(currentPage, totalPages);

    const paginatedDecks = useMemo(() => {
        const start = (activePage - 1) * pageSize;
        return filteredAndSortedDecks.slice(start, start + pageSize);
    }, [filteredAndSortedDecks, activePage, pageSize]);

    const paginatedDocuments = useMemo(() => {
        const start = (activePage - 1) * pageSize;
        return groupedDocuments.slice(start, start + pageSize);
    }, [groupedDocuments, activePage, pageSize]);

    const hasActiveFilters = searchQuery.trim() !== "" || sizeFilter !== "all" || sortBy !== "most-cards";

    const resetFilters = () => {
        setSearchQuery("");
        setSizeFilter("all");
        setSortBy("most-cards");
        setCurrentPage(1);
    };

    const selectedDocName = selectedDocumentId ? groupedDocuments.find(d => d.documentId === selectedDocumentId)?.documentName : null;

    return (
        <div className="flex flex-col gap-8 pb-20 pt-6 max-w-7xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-700 dark:border-dark-400 pb-5">
                <div className="flex items-center gap-3.5">
                    <Link
                        href="/home"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-800 dark:hover:bg-dark-400 text-dark300_light700 transition-all cursor-pointer"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="h2 text-dark100_light900 font-bold">Your Flashcards</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20 border border-brand/20">
                                {decks.length} {decks.length === 1 ? "Deck" : "Decks"}
                            </span>
                        </div>
                        <p className="body-2 text-dark500_light400 mt-0.5">
                            Search, sort, filter, and study your generated flashcard collections powered by SM-2 Spaced Repetition.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 p-6 rounded-3xl bg-gradient-to-br from-brand to-emerald-600 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5" /> SM-2 Spaced Repetition
                        </div>
                        <h2 className="text-2xl font-extrabold mb-1">Due For Review</h2>
                        <p className="text-emerald-100 text-sm mb-6">
                            Cards scheduled for practice today based on your personalized memory retention curve.
                        </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div>
                            <span className="text-3xl font-black">{actualDueCount}</span>
                            <span className="text-xs text-emerald-100 ml-1.5 uppercase font-medium">Cards Due</span>
                        </div>
                        <Link href="/flashcards/due">
                            <Button
                                variant="secondary"
                                disabled={actualDueCount === 0}
                                className="bg-white text-brand hover:bg-emerald-50 font-bold rounded-xl px-5 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {actualDueCount > 0 ? "Study Now" : "All Done!"}
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-5 bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl flex flex-col justify-between shadow-drop-1">
                        <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl w-fit mb-3">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-dark100_light900">{stats?.totalReviewed ?? 0}</p>
                            <p className="text-xs font-medium text-light-200 dark:text-dark-400 mt-0.5">Total Reviewed</p>
                        </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl flex flex-col justify-between shadow-drop-1">
                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit mb-3">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-dark100_light900">{stats?.masteredCount ?? 0}</p>
                            <p className="text-xs font-medium text-light-200 dark:text-dark-400 mt-0.5">Mastered Cards</p>
                        </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl flex flex-col justify-between shadow-drop-1 col-span-2 sm:col-span-1">
                        <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl w-fit mb-3">
                            <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-extrabold text-dark100_light900">
                                {stats?.averageEaseFactor ? stats.averageEaseFactor.toFixed(2) : "2.50"}
                            </p>
                            <p className="text-xs font-medium text-light-200 dark:text-dark-400 mt-0.5">Avg Ease Factor</p>
                        </div>
                    </div>
                </div>
            </div>

            {decks.length > 0 && (
                <div className="flex flex-col gap-4 bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 p-5 rounded-3xl shadow-drop-1">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-light-200 dark:text-dark-400" />
                            <input
                                type="text"
                                placeholder="Search decks or card content..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-9 py-2.5 text-sm bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand/40 text-dark100_light900 placeholder:text-light-200 dark:placeholder:text-dark-400 transition-all font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setCurrentPage(1);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-light-200 hover:text-dark-100 dark:text-dark-400 dark:hover:text-dark-100 cursor-pointer"
                                    title="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-3.5 py-2 bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-xl text-sm font-medium text-dark200_light800">
                                <Layers className="h-4 w-4 text-brand shrink-0" />
                                <span className="text-xs text-light-200 dark:text-dark-400 font-bold uppercase tracking-wider shrink-0">Size:</span>
                                <select
                                    value={sizeFilter}
                                    onChange={(e) => {
                                        setSizeFilter(e.target.value as "all" | "small" | "medium" | "large");
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none focus:outline-hidden text-sm font-bold text-dark100_light900 cursor-pointer pr-2"
                                >
                                    <option value="all">All Sizes</option>
                                    <option value="small">Small (1-10 Cards)</option>
                                    <option value="medium">Medium (11-30 Cards)</option>
                                    <option value="large">Large (30+ Cards)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-3.5 py-2 bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-xl text-sm font-medium text-dark200_light800">
                                <ArrowUpDown className="h-4 w-4 text-brand shrink-0" />
                                <span className="text-xs text-light-200 dark:text-dark-400 font-bold uppercase tracking-wider shrink-0">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value as "most-cards" | "fewest-cards" | "name-asc" | "name-desc" | "newest" | "oldest");
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none focus:outline-hidden text-sm font-bold text-dark100_light900 cursor-pointer pr-2"
                                >
                                    <option value="most-cards">Most Cards</option>
                                    <option value="fewest-cards">Fewest Cards</option>
                                    <option value="name-asc">Document (A-Z)</option>
                                    <option value="name-desc">Document (Z-A)</option>
                                    <option value="newest">Newest Deck</option>
                                    <option value="oldest">Oldest Deck</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-3.5 py-2 bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-xl text-sm font-medium text-dark200_light800">
                                <span className="text-xs text-light-200 dark:text-dark-400 font-bold uppercase tracking-wider shrink-0">Show:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none focus:outline-hidden text-sm font-bold text-dark100_light900 cursor-pointer pr-1"
                                >
                                    <option value={6}>6</option>
                                    <option value={9}>9</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-light-700 dark:border-dark-400">
                            <span className="text-xs font-bold text-light-200 dark:text-dark-400">Active Filters:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10 text-brand dark:bg-brand/20 text-xs font-bold border border-brand/20">
                                    Search: &quot;{searchQuery}&quot;
                                    <button onClick={() => { setSearchQuery(""); setCurrentPage(1); }} className="hover:text-dark-100 cursor-pointer">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {sizeFilter !== "all" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10 text-brand dark:bg-brand/20 text-xs font-bold border border-brand/20">
                                    Size: {sizeFilter === "small" ? "Small (1-10)" : sizeFilter === "medium" ? "Medium (11-30)" : "Large (30+)"}
                                    <button onClick={() => { setSizeFilter("all"); setCurrentPage(1); }} className="hover:text-dark-100 cursor-pointer">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {sortBy !== "most-cards" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-light-800 dark:bg-dark-300 text-dark100_light900 text-xs font-bold border border-light-700 dark:border-dark-400">
                                    Sorted: {sortBy === "fewest-cards" ? "Fewest Cards" : sortBy === "name-asc" ? "Document (A-Z)" : sortBy === "name-desc" ? "Document (Z-A)" : sortBy === "newest" ? "Newest" : "Oldest"}
                                </span>
                            )}
                            <button
                                onClick={resetFilters}
                                className="text-xs font-bold text-light-200 dark:text-dark-400 hover:text-red transition-colors ml-auto underline cursor-pointer"
                            >
                                Reset All
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {!isDocumentView && (
                            <button
                                onClick={() => {
                                    setSelectedDocumentId(null);
                                    setSearchQuery("");
                                    setCurrentPage(1);
                                }}
                                className="p-2 bg-light-800 dark:bg-dark-300 hover:bg-light-700 dark:hover:bg-dark-400 rounded-xl transition-colors text-light-200 dark:text-dark-400 cursor-pointer shadow-xs"
                                title="Back to Documents"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h2 className="text-xl font-extrabold text-dark100_light900">
                            {isDocumentView ? "📂 Your Documents" : `🗂️ Flashcard Decks for ${selectedDocName || "Document"}`}
                        </h2>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-light-800 dark:bg-dark-300 text-dark200_light800 border border-light-700 dark:border-dark-400 shadow-xs">
                        {totalItems} {isDocumentView ? (totalItems === 1 ? "Document" : "Documents") : (totalItems === 1 ? "Collection" : "Collections")}
                    </span>
                </div>

                {!decks || decks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center bg-white dark:bg-dark-200 border-2 border-dashed border-light-700 dark:border-dark-400 rounded-3xl w-full">
                        <div className="h-16 w-16 bg-light-800 dark:bg-dark-300 rounded-full flex items-center justify-center shadow-xs mb-4">
                            <Layers className="h-8 w-8 text-light-200 dark:text-dark-400" />
                        </div>
                        <h3 className="text-xl font-bold text-dark100_light900 mb-2">No flashcards yet</h3>
                        <p className="body-2 text-light-200 dark:text-dark-400 max-w-sm mb-6">
                            You haven&#39;t generated any flashcards. Select a document from your home dashboard to start studying!
                        </p>
                        <Link
                            href="/home"
                            className="px-6 py-3 bg-brand text-white rounded-full font-medium transition-all shadow-sm hover:bg-emerald-500 hover:shadow-md cursor-pointer"
                        >
                            Go to Home to Select a Document
                        </Link>
                    </div>
                ) : totalItems === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl w-full shadow-drop-1">
                        <Filter className="h-10 w-10 text-light-200 dark:text-dark-400 mb-3" />
                        <h3 className="text-lg font-bold text-dark100_light900">No matching results found</h3>
                        <p className="text-sm text-light-200 dark:text-dark-400 max-w-xs mt-1">
                            No {isDocumentView ? "documents" : "flashcard decks"} match your active filters or search query &quot;{searchQuery}&quot;.
                        </p>
                        <button
                            onClick={resetFilters}
                            className="mt-4 px-5 py-2.5 bg-brand text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isDocumentView ? (
                                paginatedDocuments.map((doc) => (
                                    <div onClick={() => { setSelectedDocumentId(doc.documentId); setCurrentPage(1); }} key={doc.documentId} className="group relative flex flex-col h-full border border-light-700 dark:border-dark-400 rounded-[2rem] bg-white dark:bg-dark-200 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 shadow-drop-1 hover:shadow-drop-3 transition-all duration-300 hover:-translate-y-1 overflow-hidden min-h-[220px] cursor-pointer">
                                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        <div className="flex flex-col flex-1 p-6 z-10 pt-7 relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 shrink-0 shadow-xs">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/20 shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                                        Document
                                                    </span>
                                                </div>
                                                <span className="text-xs font-extrabold text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 px-3.5 py-1.5 rounded-full border border-indigo-500/20 shadow-sm">
                                                    {doc.decks.length} Decks
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-dark100_light900 mb-1 leading-snug line-clamp-2 group-hover:text-indigo-500 transition-colors" title={doc.documentName}>
                                                {doc.documentName}
                                            </h3>
                                            <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-light-200 dark:text-dark-400 mb-4">
                                                <Layers className="h-3.5 w-3.5 shrink-0" />
                                                <span>{doc.totalCards} Total Flashcards</span>
                                            </div>
                                        </div>

                                        <div className="px-6 pb-6 pt-0 relative z-10">
                                            <div className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:from-purple-500 group-hover:to-indigo-500 text-sm font-bold text-white transition-all shadow-md group-hover:shadow-lg">
                                                <span>View Decks</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                paginatedDecks.map((deck) => (
                                    <Link href={`/flashcards/${deck.deckId}`} key={deck.deckId} className="group relative flex flex-col h-full border border-light-700 dark:border-dark-400 rounded-[2rem] bg-white dark:bg-dark-200 hover:border-brand/40 dark:hover:border-brand/40 shadow-drop-1 hover:shadow-drop-3 transition-all duration-300 hover:-translate-y-1 overflow-hidden min-h-[220px]">
                                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        <div className="flex flex-col flex-1 p-6 z-10 pt-7 relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3.5 bg-brand/10 dark:bg-brand/20 rounded-2xl text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300 shrink-0 shadow-xs">
                                                        <Layers className="h-6 w-6" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand/10 dark:bg-brand/20 px-2.5 py-1 rounded-md border border-brand/20 shadow-sm group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                                                        Deck
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-extrabold text-brand bg-brand/10 dark:bg-brand/20 px-3.5 py-1.5 rounded-full border border-brand/20 shadow-sm">
                                                        {deck.cards.length} Thẻ
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleDeleteDeck(e, deck.deckId)}
                                                        disabled={deletingDeckId === deck.deckId}
                                                        className="p-1.5 text-light-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-full transition-colors cursor-pointer z-20"
                                                        title="Delete Deck"
                                                    >
                                                        {deletingDeckId === deck.deckId ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-dark100_light900 mb-1 leading-snug line-clamp-2 group-hover:text-brand transition-colors" title={deck.deckTitle}>
                                                {deck.deckTitle}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-light-400 mb-2 truncate">
                                                <FileText className="h-3 w-3 shrink-0" />
                                                <span className="truncate" title={deck.documentName}>{deck.documentName}</span>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-light-200 dark:text-dark-400 mb-4">
                                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                                <span>
                                                    Tạo ngày:{" "}
                                                    {formatDateGMT7(deck.createdAt || deck.cards[0]?.createdAt || new Date().toISOString(), {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-6 pb-6 pt-0 relative z-10">
                                            <div className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-brand to-emerald-500 group-hover:from-emerald-400 group-hover:to-brand text-sm font-bold text-white transition-all shadow-md group-hover:shadow-lg">
                                                <span>Học ngay</span>
                                                <Play className="h-4 w-4 fill-current" />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 p-4 sm:px-6 rounded-3xl shadow-drop-1 mt-6">
                                <span className="text-xs font-bold text-light-200 dark:text-dark-400">
                                    Showing <span className="text-dark100_light900 font-extrabold">{(activePage - 1) * pageSize + 1}</span> to{" "}
                                    <span className="text-dark100_light900 font-extrabold">{Math.min(activePage * pageSize, filteredAndSortedDecks.length)}</span> of{" "}
                                    <span className="text-dark100_light900 font-extrabold">{filteredAndSortedDecks.length}</span> Decks
                                </span>

                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={activePage === 1}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-dark200_light800 disabled:opacity-30 hover:bg-light-700 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                                        title="First Page"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={activePage === 1}
                                        className="flex h-9 px-3 items-center justify-center gap-1 rounded-xl bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-xs font-bold text-dark200_light800 disabled:opacity-30 hover:bg-light-700 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="hidden sm:inline">Prev</span>
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - activePage) <= 1)
                                        .map((p, idx, arr) => {
                                            const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                                            return (
                                                <React.Fragment key={p}>
                                                    {showEllipsisBefore && (
                                                        <span className="px-1 text-xs font-bold text-light-200 dark:text-dark-400">...</span>
                                                    )}
                                                    <button
                                                        onClick={() => setCurrentPage(p)}
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                            activePage === p
                                                                ? "bg-brand text-white shadow-sm"
                                                                : "bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-dark200_light800 hover:bg-light-700 dark:hover:bg-dark-400"
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </React.Fragment>
                                            );
                                        })}

                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={activePage === totalPages}
                                        className="flex h-9 px-3 items-center justify-center gap-1 rounded-xl bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-xs font-bold text-dark200_light800 disabled:opacity-30 hover:bg-light-700 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={activePage === totalPages}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-dark200_light800 disabled:opacity-30 hover:bg-light-700 dark:hover:bg-dark-400 transition-colors cursor-pointer"
                                        title="Last Page"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
