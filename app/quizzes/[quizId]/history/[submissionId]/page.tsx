import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateGMT7 } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Award, LayoutList } from "lucide-react";
import { getQuizSubmissionDetail } from "@/lib/actions/ai.actions";

type Props = {
    params: Promise<{
        quizId: string;
        submissionId: string;
    }>;
};

export default async function QuizSubmissionDetailPage({ params }: Props) {
    const { quizId, submissionId } = await params;

    const detail = await getQuizSubmissionDetail(submissionId).catch(() => null);

    if (!detail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
                <div className="p-4 bg-red/10 rounded-full mb-4">
                    <XCircle className="h-10 w-10 text-red" />
                </div>
                <h1 className="text-2xl font-bold text-dark100_light900 mb-2">Submission Not Found</h1>
                <p className="text-light-200 dark:text-dark-400 mb-6">Could not load the details for this quiz attempt.</p>
                <Link
                    href={`/quizzes/${quizId}/history`}
                    className="px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors"
                >
                    Back to History
                </Link>
            </div>
        );
    }

    const formatDate = (dateStr?: string | null) => {
        return formatDateGMT7(dateStr, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const isPassed = detail.percentageScore >= 70;

    return (
        <div className="flex flex-col gap-8 pb-20 pt-6 max-w-4xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
            {/* Header & Navigation */}
            <div className="flex flex-col gap-6 border-b border-light-700 dark:border-dark-400 pb-6">
                <Link
                    href={`/quizzes/${quizId}/history`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-light-200 dark:text-dark-400 hover:text-brand dark:hover:text-brand transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to History
                </Link>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                            {detail.subjectCode} - {detail.subjectName}
                        </span>
                        {isPassed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Passed
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                Failed
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-dark100_light900 tracking-tight break-all sm:break-words leading-tight">
                        {detail.quizTitle}
                    </h1>
                    <p className="body-2 text-dark500_light400 mt-2 flex items-center gap-2">
                        <span>Submitted on {formatDate(detail.submittedAt)}</span>
                    </p>
                </div>
            </div>

            {/* Score Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-dark-200 rounded-3xl p-5 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-center items-center text-center">
                    <div className="p-2.5 bg-brand/10 dark:bg-brand/20 rounded-xl text-brand mb-3">
                        <Award className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-light-200 dark:text-dark-400 mb-1">Score</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-dark100_light900">
                        {detail.score}<span className="text-sm sm:text-base text-light-200 dark:text-dark-400 font-bold">/{detail.maxScore}</span>
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-5 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-center items-center text-center">
                    <div className={`p-2.5 rounded-xl mb-3 ${isPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        {isPassed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-light-200 dark:text-dark-400 mb-1">Accuracy</p>
                    <p className={`text-2xl sm:text-3xl font-extrabold ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {detail.percentageScore}%
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-5 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-center items-center text-center">
                    <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 mb-3">
                        <LayoutList className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-light-200 dark:text-dark-400 mb-1">Correct</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-dark100_light900">
                        {detail.totalCorrect}<span className="text-sm sm:text-base text-light-200 dark:text-dark-400 font-bold">/{detail.questions.length}</span>
                    </p>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-5 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-center items-center text-center">
                    <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 mb-3">
                        <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-light-200 dark:text-dark-400 mb-1">Duration</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-dark100_light900">
                        {formatDuration(detail.durationSeconds)}
                    </p>
                </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-light-700 dark:border-dark-400 pb-4">
                    <h2 className="h3 font-bold text-dark100_light900">Question Review</h2>
                    <span className="text-xs font-bold px-3 py-1 bg-light-800 dark:bg-dark-300 text-dark200_light800 rounded-full">
                        {detail.questions.length} Questions
                    </span>
                </div>

                <div className="space-y-6">
                    {detail.questions.map((q, idx) => {
                        // Check if the user answered this question correctly (at least one selected correct option, and no selected incorrect options)
                        // This logic can vary based on multi-select, but let's assume standard multiple choice for coloring the question header.
                        const isQuestionCorrect = q.options.some(o => o.isSelected && o.isCorrect) && !q.options.some(o => o.isSelected && !o.isCorrect);

                        return (
                            <div key={q.questionId} className="bg-white dark:bg-dark-200 rounded-3xl p-5 sm:p-7 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-bold shadow-xs ${isQuestionCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="pt-2">
                                        <h3 className="text-lg font-bold text-dark100_light900 leading-snug">
                                            {q.title}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 mt-2 pl-14">
                                    {q.options.map((opt) => {
                                        // Determine styling based on selected and correct
                                        let bgStyle = "bg-light-800/50 dark:bg-dark-300/50 border-light-700 dark:border-dark-400";
                                        let textStyle = "text-dark300_light700";
                                        let icon = null;

                                        if (opt.isSelected && opt.isCorrect) {
                                            bgStyle = "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/20 dark:border-emerald-500/40";
                                            textStyle = "text-emerald-700 dark:text-emerald-400 font-semibold";
                                            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                                        } else if (opt.isSelected && !opt.isCorrect) {
                                            bgStyle = "bg-rose-500/10 border-rose-500/30 dark:bg-rose-500/20 dark:border-rose-500/40";
                                            textStyle = "text-rose-700 dark:text-rose-400 font-semibold";
                                            icon = <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
                                        } else if (!opt.isSelected && opt.isCorrect) {
                                            bgStyle = "bg-white dark:bg-dark-200 border-emerald-500 border-dashed border-2";
                                            textStyle = "text-emerald-700 dark:text-emerald-400 font-semibold";
                                            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 opacity-60" />;
                                        }

                                        return (
                                            <div
                                                key={opt.answerId}
                                                className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${bgStyle}`}
                                            >
                                                <div className="shrink-0 pt-0.5 w-5 h-5">
                                                    {icon ? icon : <div className="w-5 h-5 rounded-full border-2 border-light-400 dark:border-dark-400" />}
                                                </div>
                                                <span className={`text-sm sm:text-base ${textStyle}`}>
                                                    {opt.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
