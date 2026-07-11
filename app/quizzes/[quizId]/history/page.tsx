import React from "react";
import Link from "next/link";
import { getQuizById, getQuizHistory } from "@/lib/actions/ai.actions";
import { ArrowLeft, History, Trophy, Award, Clock, CheckCircle2, XCircle, BarChart3, Play } from "lucide-react";

type Props = {
    params: Promise<{
        quizId: string;
    }>;
};

export default async function QuizHistoryPage({ params }: Props) {
    const { quizId } = await params;

    const [quizData, history] = await Promise.all([
        getQuizById(quizId).catch(() => null),
        getQuizHistory(quizId).catch(() => [])
    ]);

    const quizTitle = quizData?.quizTitle || "Quiz Submission History";
    const totalAttempts = history.length;

    let highestPercentage = 0;
    let avgPercentage = 0;
    let latestScore = 0;

    if (totalAttempts > 0) {
        const percentages = history.map((h) => {
            const max = h.maxScore || 10;
            return Math.round(((h.score ?? h.totalCorrect ?? 0) / max) * 100);
        });
        highestPercentage = Math.max(...percentages);
        avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / totalAttempts);
        const latestMax = history[0].maxScore || 10;
        latestScore = Math.round(((history[0].score ?? history[0].totalCorrect ?? 0) / latestMax) * 100);
    }

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "N/A";
        try {
            return new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    return (
        <main className="min-h-screen bg-light-800 dark:bg-dark-100 py-12 px-4 sm:px-6 transition-colors">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Navigation & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Link
                            href="/quizzes"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-dark-400 hover:text-brand transition-colors mb-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Quizzes Dashboard</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-brand/20 to-emerald-500/10 border border-brand/20">
                                <History className="h-7 w-7 text-brand" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-dark-100 tracking-tight">
                                    {quizTitle}
                                </h1>
                                <p className="text-sm font-medium text-dark-400 mt-0.5">
                                    Review all your past attempts, grading timestamps, and performance over time.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={`/quizzes/${quizId}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Retake Quiz Now</span>
                    </Link>
                </div>

                {/* Summary Statistics Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-white dark:bg-dark-200 border border-slate-200/80 dark:border-dark-300 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Total Attempts</p>
                            <p className="text-3xl font-extrabold text-dark-100 mt-1">{totalAttempts}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-200 border border-slate-200/80 dark:border-dark-300 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                            <Trophy className="h-7 w-7 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Personal Best</p>
                            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                                {totalAttempts > 0 ? `${highestPercentage}%` : "—"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-200 border border-slate-200/80 dark:border-dark-300 rounded-3xl p-6 shadow-xs flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                            <Award className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Average Score</p>
                            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                                {totalAttempts > 0 ? `${avgPercentage}%` : "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="bg-white dark:bg-dark-200 border border-slate-200/80 dark:border-dark-300 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-300 pb-5">
                        <h2 className="text-xl font-extrabold text-dark-100 flex items-center gap-2.5">
                            <Clock className="h-5 w-5 text-brand" />
                            <span>Submission History Logs</span>
                        </h2>
                        <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-dark-300 text-dark-300 rounded-full">
                            {totalAttempts} {totalAttempts === 1 ? "Record" : "Records"}
                        </span>
                    </div>

                    {totalAttempts === 0 ? (
                        <div className="text-center py-16 px-4 space-y-4">
                            <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-dark-300 text-slate-400 dark:text-dark-400">
                                <History className="h-10 w-10 stroke-[1.5]" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-100">No Attempts Recorded Yet</h3>
                            <p className="text-sm font-medium text-dark-400 max-w-md mx-auto">
                                You haven't submitted any answers for this quiz. Jump in and take your first attempt to start building your study streak!
                            </p>
                            <div className="pt-2">
                                <Link
                                    href={`/quizzes/${quizId}`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition-colors"
                                >
                                    <span>Start Quiz Now</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((attempt, idx) => {
                                const attemptNum = totalAttempts - idx;
                                const max = attempt.maxScore || 10;
                                const scoreVal = attempt.score ?? attempt.totalCorrect ?? 0;
                                const percentage = Math.round((scoreVal / max) * 100);
                                const isPassed = percentage >= 70;

                                return (
                                    <div
                                        key={attempt.id || idx}
                                        className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-dark-300 hover:border-brand/40 dark:hover:border-brand/40 transition-all bg-slate-50/50 dark:bg-dark-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                                    >
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-dark-200 border border-slate-200 dark:border-dark-300 text-xs font-extrabold text-dark-200">
                                                    Attempt #{attemptNum}
                                                </span>
                                                {idx === 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                                        Latest Attempt
                                                    </span>
                                                )}
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                        isPassed
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                                    }`}
                                                >
                                                    {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                                    <span>{isPassed ? "Passed" : "Needs Practice"}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-medium text-dark-400 pt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    Submitted: {formatDate(attempt.submittedAt)}
                                                </span>
                                                {attempt.gradedAt && (
                                                    <span className="text-slate-400">• Graded Instantly</span>
                                                )}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full max-w-sm h-2 rounded-full bg-slate-200 dark:bg-dark-300 overflow-hidden mt-2">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        percentage >= 80
                                                            ? "bg-emerald-500"
                                                            : percentage >= 50
                                                            ? "bg-amber-500"
                                                            : "bg-red"
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60 dark:border-dark-300 shrink-0">
                                            <div className="text-right">
                                                <div className="text-2xl sm:text-3xl font-extrabold text-dark-100">
                                                    {percentage}%
                                                </div>
                                                <div className="text-xs font-bold text-dark-400">
                                                    {scoreVal} / {max} Correct
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
