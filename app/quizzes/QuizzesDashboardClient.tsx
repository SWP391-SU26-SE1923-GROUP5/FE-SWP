"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BrainCircuit, Clock, ArrowLeft, Trash2, Search, ArrowUpDown, History, Play, Filter } from "lucide-react";
import { QuizRecord } from "@/types";
import { deleteQuiz } from "@/lib/actions/ai.actions";

type Props = {
    initialQuizzes: QuizRecord[];
};

export default function QuizzesDashboardClient({ initialQuizzes }: Props) {
    const [quizzes, setQuizzes] = useState<QuizRecord[]>(initialQuizzes);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc" | "title-desc">("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const pageSize = 9;

    const filteredAndSortedQuizzes = useMemo(() => {
        let result = [...quizzes];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((q) => q.title?.toLowerCase().includes(query));
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
    }, [quizzes, searchQuery, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSortedQuizzes.length / pageSize));
    const paginatedQuizzes = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAndSortedQuizzes.slice(start, start + pageSize);
    }, [filteredAndSortedQuizzes, currentPage]);

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
        <div className="flex flex-col gap-8 pb-20 pt-6 max-w-5xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
            {/* Top Navigation & Header Banner */}
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
                            Review, search, and retake your previously generated quizzes or check attempt logs.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search & Sort Controls */}
            {quizzes.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-dark-200 border border-slate-200 dark:border-dark-300 p-4 rounded-2xl shadow-xs">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search quizzes by title..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-dark-300 border border-slate-200 dark:border-dark-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand/40 text-dark-100 placeholder:text-slate-400 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-dark-300 border border-slate-200 dark:border-dark-400 rounded-xl text-sm font-medium text-dark-200 w-full sm:w-auto">
                            <ArrowUpDown className="h-4 w-4 text-brand shrink-0" />
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">Sort By:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent border-none focus:outline-hidden text-sm font-bold text-dark-100 cursor-pointer pr-2"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title-asc">Title (A-Z)</option>
                                <option value="title-desc">Title (Z-A)</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {!quizzes || quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center bg-slate-50/50 dark:bg-dark-200/50 border-2 border-dashed border-slate-200 dark:border-dark-300 rounded-3xl w-full">
                    <div className="h-16 w-16 bg-white dark:bg-dark-300 rounded-full flex items-center justify-center shadow-sm mb-4">
                        <BrainCircuit className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-dark-100 mb-2">No quizzes yet</h3>
                    <p className="text-slate-500 dark:text-dark-400 max-w-sm mb-6">
                        You haven&#39;t generated any quizzes. Select a document from your home dashboard to test your knowledge!
                    </p>
                    <Link
                        href="/home"
                        className="px-6 py-3 bg-brand text-white rounded-full font-medium transition-all shadow-sm [&:hover]:bg-emerald-400 [&:hover]:shadow-md cursor-pointer"
                    >
                        Go to Home to Select a Document
                    </Link>
                </div>
            ) : filteredAndSortedQuizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-dark-200 border border-slate-200 dark:border-dark-300 rounded-3xl w-full">
                    <Filter className="h-10 w-10 text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-dark-100">No matching quizzes found</h3>
                    <p className="text-sm text-slate-500 max-w-xs mt-1">
                        No quizzes match your search query &quot;{searchQuery}&quot;. Try adjusting your filters.
                    </p>
                    <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 px-4 py-2 bg-slate-100 dark:bg-dark-300 hover:bg-slate-200 text-dark-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedQuizzes.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="relative group flex flex-col h-full border border-slate-200 dark:border-dark-300 rounded-2xl bg-white dark:bg-dark-200 hover:border-brand dark:hover:border-brand hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                            >
                                <Link href={`/quizzes/${quiz.id}`} className="flex flex-col flex-1 p-6">
                                    <div className="flex items-start gap-4 mb-4 pr-10">
                                        <div className="p-3 bg-brand/10 rounded-xl text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                                            <BrainCircuit className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-lg text-dark-200 dark:text-dark-100 leading-snug line-clamp-2 mt-1">
                                            {quiz.title}
                                        </h3>
                                    </div>

                                    <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-dark-400">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            Created:{" "}
                                            {new Date(quiz.createdAt).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </Link>

                                {/* Bottom Action Strip: Start & History */}
                                <div className="px-6 pb-5 pt-3 border-t border-slate-100 dark:border-dark-300 flex items-center justify-between gap-3">
                                    <Link
                                        href={`/quizzes/${quiz.id}/history`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-300 hover:bg-slate-200 dark:hover:bg-dark-400 text-xs font-bold text-dark-200 dark:text-dark-100 transition-colors cursor-pointer"
                                        title="View Attempt History"
                                    >
                                        <History className="h-3.5 w-3.5 text-brand" />
                                        <span>History</span>
                                    </Link>

                                    <Link
                                        href={`/quizzes/${quiz.id}`}
                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-emerald-600 transition-colors cursor-pointer"
                                    >
                                        <span>Start Quiz</span>
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                    </Link>
                                </div>

                                <button
                                    onClick={(e) => handleDelete(e, quiz.id)}
                                    disabled={isDeleting === quiz.id}
                                    className="absolute top-4 right-4 z-20 flex items-center justify-center h-8 w-8 text-slate-400 bg-slate-100 dark:bg-dark-300 [&:hover]:text-white [&:hover]:bg-red rounded-full transition-all cursor-pointer shadow-sm [&:hover]:shadow-md disabled:opacity-50"
                                    title="Delete Quiz"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-300 pt-6 mt-4">
                            <span className="text-xs font-bold text-slate-500 dark:text-dark-400">
                                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                                {Math.min(currentPage * pageSize, filteredAndSortedQuizzes.length)} of{" "}
                                {filteredAndSortedQuizzes.length} Quizzes
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-white dark:bg-dark-200 border border-slate-200 dark:border-dark-300 text-xs font-bold text-dark-100 disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-extrabold text-dark-100 px-3 py-2 bg-slate-100 dark:bg-dark-300 rounded-xl">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-white dark:bg-dark-200 border border-slate-200 dark:border-dark-300 text-xs font-bold text-dark-100 disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
