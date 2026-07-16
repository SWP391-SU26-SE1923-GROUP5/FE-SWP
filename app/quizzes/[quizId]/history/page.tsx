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
        <div className="flex flex-col gap-8 pb-20 pt-6 max-w-7xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-light-700 dark:border-dark-400 pb-6">
                <div className="flex items-start gap-4 min-w-0 flex-1 overflow-hidden">
                    <Link
                        href="/quizzes"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-800 dark:hover:bg-dark-300 text-dark300_light700 transition-all cursor-pointer mt-0.5"
                        title="Back to Quizzes Dashboard"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand dark:bg-brand/20 border border-brand/20">
                                <History className="w-3.5 h-3.5" />
                                Quiz Attempt History
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark100_light900 tracking-tight break-all sm:break-words">
                            {quizTitle}
                        </h1>
                        <p className="body-2 text-dark500_light400 mt-1.5">
                            Review your past attempts, grading timestamps, and performance progression over time.
                        </p>
                    </div>
                </div>

                <div className="shrink-0 pt-2 md:pt-0">
                    <Link
                        href={`/quizzes/${quizId}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Retake Quiz Now</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-7 border border-light-700 dark:border-dark-400 shadow-drop-1 hover:shadow-drop-3 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-light-200 dark:text-dark-400">Total Attempts</p>
                            <h3 className="text-3xl font-extrabold text-dark100_light900 tracking-tight mt-0.5 group-hover:scale-[1.02] transition-transform origin-left">
                                {totalAttempts}
                            </h3>
                        </div>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-light-700/60 dark:border-dark-400/60 text-xs text-light-200 dark:text-dark-400 font-medium">
                        Recorded submissions
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-7 border border-light-700 dark:border-dark-400 shadow-drop-1 hover:shadow-drop-3 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-light-200 dark:text-dark-400">Personal Best</p>
                            <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-0.5 group-hover:scale-[1.02] transition-transform origin-left">
                                {totalAttempts > 0 ? `${highestPercentage}%` : "—"}
                            </h3>
                        </div>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-light-700/60 dark:border-dark-400/60 text-xs text-light-200 dark:text-dark-400 font-medium">
                        Highest attempt accuracy
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-7 border border-light-700 dark:border-dark-400 shadow-drop-1 hover:shadow-drop-3 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-light-200 dark:text-dark-400">Average Score</p>
                            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5 group-hover:scale-[1.02] transition-transform origin-left">
                                {totalAttempts > 0 ? `${avgPercentage}%` : "—"}
                            </h3>
                        </div>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-light-700/60 dark:border-dark-400/60 text-xs text-light-200 dark:text-dark-400 font-medium">
                        Mean score across attempts
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl p-6 sm:p-8 shadow-drop-1 space-y-6">
                <div className="flex items-center justify-between border-b border-light-700 dark:border-dark-400 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand/10 dark:bg-brand/20 rounded-xl text-brand">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="h3 font-bold text-dark100_light900">Submission History Logs</h2>
                            <p className="body-2 text-light-200 dark:text-dark-400">Detailed breakdown of each recorded attempt</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold px-3.5 py-1.5 bg-light-800 dark:bg-dark-300 text-dark200_light800 rounded-full border border-light-700 dark:border-dark-400">
                        {totalAttempts} {totalAttempts === 1 ? "Record" : "Records"}
                    </span>
                </div>

                {totalAttempts === 0 ? (
                    <div className="text-center py-16 px-4 space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-light-800 dark:bg-dark-300 text-light-200 dark:text-dark-400">
                            <History className="h-10 w-10 stroke-[1.5]" />
                        </div>
                        <h3 className="text-lg font-bold text-dark100_light900">No Attempts Recorded Yet</h3>
                        <p className="text-sm font-medium text-light-200 dark:text-dark-400 max-w-md mx-auto">
                            You haven&#39;t submitted any answers for this quiz. Jump in and take your first attempt to start building your study streak!
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
                                    className="p-6 rounded-2xl border border-light-700 dark:border-dark-400 hover:border-brand/40 dark:hover:border-brand/40 transition-all bg-light-800/40 dark:bg-dark-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                                >
                                    <div className="space-y-3 flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 text-xs font-extrabold text-dark100_light900">
                                                Attempt #{attemptNum}
                                            </span>
                                            {idx === 0 && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
                                                    Latest Attempt
                                                </span>
                                            )}
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                    isPassed
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                }`}
                                            >
                                                {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                                <span>{isPassed ? "Passed" : "Needs Practice"}</span>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-medium text-light-200 dark:text-dark-400">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-light-200 dark:text-dark-400" />
                                                Submitted: {formatDate(attempt.submittedAt)}
                                            </span>
                                            {attempt.gradedAt && (
                                                <span>• Graded Instantly</span>
                                            )}
                                        </div>

                                        <div className="w-full max-w-md h-2 rounded-full bg-light-700 dark:bg-dark-400 overflow-hidden mt-1">
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

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-light-700/60 dark:border-dark-400 shrink-0">
                                        <div className="text-right">
                                            <div className="text-3xl font-extrabold text-dark100_light900">
                                                {percentage}%
                                            </div>
                                            <div className="text-xs font-bold text-light-200 dark:text-dark-400 mt-0.5">
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
    );
}
