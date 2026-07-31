"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BrainCircuit, Clock, ArrowLeft, Trash2, Search, ArrowUpDown, History, Play, Filter, X, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { QuizRecord } from "@/types";
import { deleteQuiz } from "@/lib/actions/ai.actions";

type Props = {
    initialQuizzes: QuizRecord[];
};

export default function QuizzesDashboardClient({ initialQuizzes }: Props) {
    const [quizzes, setQuizzes] = useState<QuizRecord[]>(initialQuizzes);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc" | "title-desc">("newest");
    const [timeFilter, setTimeFilter] = useState<"all" | "7d" | "30d">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(9);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const filteredAndSortedQuizzes = useMemo(() => {
        let result = [...quizzes];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((q) => q.title?.toLowerCase().includes(query));
        }

        if (timeFilter !== "all") {
            const now = new Date().getTime();
            const daysMs = timeFilter === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
            result = result.filter((q) => {
                const createdTime = new Date(q.createdAt).getTime();
                return now - createdTime <= daysMs;
            });
        }

        result.sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === "oldest") {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === "title-asc") {
                return (a.title || "").localeCompare(b.title || "");
            } else if (sortBy === "title-desc") {
                return (b.title || "").localeCompare(a.title || "");
            }
            return 0;
        });

        return result;
    }, [quizzes, searchQuery, timeFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedQuizzes.length / pageSize));
    
    const activePage = Math.min(currentPage, totalPages);

    const paginatedQuizzes = useMemo(() => {
        const start = (activePage - 1) * pageSize;
        return filteredAndSortedQuizzes.slice(start, start + pageSize);
    }, [filteredAndSortedQuizzes, activePage, pageSize]);

    const hasActiveFilters = searchQuery.trim() !== "" || timeFilter !== "all" || sortBy !== "newest";

    const resetFilters = () => {
        setSearchQuery("");
        setTimeFilter("all");
        setSortBy("newest");
        setCurrentPage(1);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this quiz? All question records and submission history for this quiz will be permanently removed.")) {
            setIsDeleting(id);
            try {
                await deleteQuiz(id);
                setQuizzes((prev) => prev.filter((q) => q.id !== id));
            } catch (err) {
                console.error("Failed to delete quiz:", err);
            } finally {
                setIsDeleting(null);
            }
        }
    };

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
                            <h1 className="h2 text-dark100_light900 font-bold">Your Quizzes</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20 border border-brand/20">
                                {quizzes.length} {quizzes.length === 1 ? "Quiz" : "Quizzes"}
                            </span>
                        </div>
                        <p className="body-2 text-dark500_light400 mt-0.5">
                            Search, filter, sort, and retake your previously generated quizzes or check attempt logs.
                        </p>
                    </div>
                </div>
            </div>

            {quizzes.length > 0 && (
                <div className="flex flex-col gap-4 bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 p-5 rounded-3xl shadow-drop-1">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-light-200 dark:text-dark-400" />
                            <input
                                type="text"
                                placeholder="Search quizzes by title..."
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
                                <Calendar className="h-4 w-4 text-brand shrink-0" />
                                <span className="text-xs text-light-200 dark:text-dark-400 font-bold uppercase tracking-wider shrink-0">Time:</span>
                                <select
                                    value={timeFilter}
                                    onChange={(e) => {
                                        setTimeFilter(e.target.value as "all" | "7d" | "30d");
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none focus:outline-hidden text-sm font-bold text-dark100_light900 cursor-pointer pr-2"
                                >
                                    <option value="all">All Time</option>
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d">Last 30 Days</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-3.5 py-2 bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 rounded-xl text-sm font-medium text-dark200_light800">
                                <ArrowUpDown className="h-4 w-4 text-brand shrink-0" />
                                <span className="text-xs text-light-200 dark:text-dark-400 font-bold uppercase tracking-wider shrink-0">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value as "newest" | "oldest" | "title-asc" | "title-desc");
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none focus:outline-hidden text-sm font-bold text-dark100_light900 cursor-pointer pr-2"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="title-asc">Title (A-Z)</option>
                                    <option value="title-desc">Title (Z-A)</option>
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
                            {timeFilter !== "all" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10 text-brand dark:bg-brand/20 text-xs font-bold border border-brand/20">
                                    Time: {timeFilter === "7d" ? "Last 7 Days" : "Last 30 Days"}
                                    <button onClick={() => { setTimeFilter("all"); setCurrentPage(1); }} className="hover:text-dark-100 cursor-pointer">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {sortBy !== "newest" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-light-800 dark:bg-dark-300 text-dark100_light900 text-xs font-bold border border-light-700 dark:border-dark-400">
                                    Sorted: {sortBy === "oldest" ? "Oldest First" : sortBy === "title-asc" ? "Title (A-Z)" : "Title (Z-A)"}
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

            {!quizzes || quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center bg-white dark:bg-dark-200 border-2 border-dashed border-light-700 dark:border-dark-400 rounded-3xl w-full">
                    <div className="h-16 w-16 bg-light-800 dark:bg-dark-300 rounded-full flex items-center justify-center shadow-xs mb-4">
                        <BrainCircuit className="h-8 w-8 text-light-200 dark:text-dark-400" />
                    </div>
                    <h3 className="text-xl font-bold text-dark100_light900 mb-2">No quizzes yet</h3>
                    <p className="body-2 text-light-200 dark:text-dark-400 max-w-sm mb-6">
                        You haven&#39;t generated any quizzes. Select a document from your home dashboard to test your knowledge!
                    </p>
                    <Link
                        href="/home"
                        className="px-6 py-3 bg-brand text-white rounded-full font-medium transition-all shadow-sm hover:bg-emerald-500 hover:shadow-md cursor-pointer"
                    >
                        Go to Home to Select a Document
                    </Link>
                </div>
            ) : filteredAndSortedQuizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl w-full shadow-drop-1">
                    <Filter className="h-10 w-10 text-light-200 dark:text-dark-400 mb-3" />
                    <h3 className="text-lg font-bold text-dark100_light900">No matching quizzes found</h3>
                    <p className="text-sm text-light-200 dark:text-dark-400 max-w-xs mt-1">
                        No quizzes match your active filters or search query &quot;{searchQuery}&quot;.
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-28">
                        {paginatedQuizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="relative group flex flex-col h-full border border-light-700 dark:border-dark-400 rounded-[2rem] bg-white dark:bg-dark-200 hover:border-brand/40 dark:hover:border-brand/40 shadow-drop-1 hover:shadow-drop-3 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <Link href={`/quizzes/${quiz.id}`} className="flex flex-col flex-1 p-6 z-10 pt-7">
                                    <div className="flex items-start gap-4 mb-4 pr-10">
                                        <div className="p-3.5 bg-brand/10 dark:bg-brand/20 rounded-2xl text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300 shrink-0 shadow-xs">
                                            <BrainCircuit className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-lg text-dark100_light900 leading-snug line-clamp-2 mt-1 group-hover:text-brand transition-colors">
                                            {quiz.title}
                                        </h3>
                                    </div>

                                    <div className="mt-auto pt-2 flex items-center gap-2 text-xs font-semibold text-light-200 dark:text-dark-400">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            Tạo ngày:{" "}
                                            {new Date(quiz.createdAt).toLocaleDateString('vi-VN', {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </Link>

                                <div className="px-6 pb-6 pt-4 flex items-center justify-between gap-3 relative z-10">
                                    <Link
                                        href={`/quizzes/${quiz.id}/history`}
                                        className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-light-800 dark:bg-dark-300 hover:bg-light-700 dark:hover:bg-dark-400 text-dark500_light400 hover:text-brand transition-colors cursor-pointer border border-light-700 dark:border-dark-400 shrink-0 group/history shadow-inner hover:shadow-none"
                                        title="Lịch sử làm bài"
                                    >
                                        <History className="h-5 w-5 group-hover/history:-rotate-45 transition-transform" />
                                    </Link>

                                    <Link
                                        href={`/quizzes/${quiz.id}`}
                                        className="inline-flex flex-1 items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-brand to-emerald-500 hover:from-emerald-400 hover:to-brand text-sm font-bold text-white transition-all cursor-pointer shadow-md hover:shadow-lg"
                                    >
                                        <span>Bắt đầu Quiz</span>
                                        <Play className="h-4 w-4 fill-current" />
                                    </Link>
                                </div>

                                <button
                                    onClick={(e) => handleDelete(e, quiz.id)}
                                    disabled={isDeleting === quiz.id}
                                    className="absolute top-5 right-5 z-20 flex items-center justify-center h-8 w-8 text-light-200 dark:text-dark-400 bg-white/80 dark:bg-dark-300/80 backdrop-blur-sm hover:text-white hover:bg-red dark:hover:bg-red rounded-full transition-all cursor-pointer shadow-xs disabled:opacity-50 border border-light-700 dark:border-dark-400 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Xóa Quiz"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 dark:bg-dark-200/90 backdrop-blur-md border border-light-700 dark:border-dark-400 p-4 sm:px-6 rounded-3xl shadow-drop-1 mt-4">
                            <span className="text-xs font-bold text-light-200 dark:text-dark-400">
                                Showing <span className="text-dark100_light900 font-extrabold">{(activePage - 1) * pageSize + 1}</span> to{" "}
                                <span className="text-dark100_light900 font-extrabold">{Math.min(activePage * pageSize, filteredAndSortedQuizzes.length)}</span> of{" "}
                                <span className="text-dark100_light900 font-extrabold">{filteredAndSortedQuizzes.length}</span> Quizzes
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
    );
}
