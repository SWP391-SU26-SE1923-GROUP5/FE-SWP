"use client";

import React, { useEffect } from "react";
import { useReward } from "react-rewards";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Trophy, Sparkles, History } from "lucide-react";
import Link from "next/link";

type Props = {
    quizId?: string;
    scorePercentage: number;
    score: number;
    totalQuestions: number;
    xpEarned?: number;
    newAchievements?: Array<{
        title: string;
        description?: string;
        xpReward?: number;
    }>;
    levelUpToast?: {
        newLevel: number;
        title?: string;
        message?: string;
    } | null;
};

const QuizSubmission = ({ quizId, scorePercentage, score, totalQuestions, xpEarned = 0, newAchievements = [], levelUpToast = null }: Props) => {
    const { reward } = useReward("rewardId", "confetti");
    const router = useRouter();

    useEffect(() => {
        if (scorePercentage === 100 || newAchievements.length > 0 || levelUpToast) {
            reward();
        }
    }, [scorePercentage, newAchievements.length, levelUpToast, reward]);

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="flex flex-col flex-1">
            <div className="flex justify-end pt-4">
                <Button size="icon" variant="outline" onClick={handleBack} className="rounded-full cursor-pointer">
                    <X className="h-5 w-5 text-slate-500" />
                </Button>
            </div>

            <main className="py-11 flex flex-col gap-6 items-center flex-1 mt-6">
                <h2 className="text-3xl font-bold text-dark-100">Quiz Complete!</h2>
                <p className="text-lg font-medium text-light-200">You scored: {scorePercentage}%</p>

                {levelUpToast && (
                    <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-brand/20 border-2 border-amber-400/60 rounded-3xl shadow-md animate-in fade-in duration-500 max-w-md w-full">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
                            <Sparkles className="h-7 w-7 animate-spin" style={{ animationDuration: '6s' }} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Level Up Celebration</span>
                            <span className="text-xl font-extrabold text-dark-100">{levelUpToast.title || `Level ${levelUpToast.newLevel} Unlocked!`}</span>
                            {levelUpToast.message && <span className="text-sm font-medium text-dark-400">{levelUpToast.message}</span>}
                        </div>
                    </div>
                )}

                {xpEarned > 0 && (
                    <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 border border-amber-200 rounded-full animate-bounce">
                        <span className="text-xl font-extrabold text-amber-600">+{xpEarned} XP Earned!</span>
                    </div>
                )}

                {newAchievements.length > 0 && (
                    <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-md">
                        <h3 className="text-lg font-bold text-brand">🎉 New Badges Unlocked!</h3>
                        <div className="flex flex-col gap-2 w-full">
                            {newAchievements.map((badge, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-brand/10 to-amber-500/10 border border-brand/20 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Trophy className="w-8 h-8 text-amber-500 shrink-0" />
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-dark-100">{badge.title}</span>
                                            {badge.description && <span className="text-xs text-light-200">{badge.description}</span>}
                                        </div>
                                    </div>
                                    {badge.xpReward && badge.xpReward > 0 && (
                                        <span className="text-sm font-bold text-amber-600">+{badge.xpReward} XP</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {scorePercentage === 100 ? (
                    <div className="flex flex-col items-center mt-6">
                        <p className="text-xl font-bold text-brand mb-8">Flawless Victory!</p>
                        <div className="flex justify-center relative">
                            <Trophy
                                className="w-32 h-32 text-brand animate-bounce"
                                strokeWidth={1.5}
                            />
                            <span id="rewardId" className="absolute top-1/2 left-1/2" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 mt-8 w-full max-w-sm">
                        <div className="flex flex-row w-full h-4 rounded-full overflow-hidden bg-slate-100">
                            <div
                                className="bg-emerald-500 h-full transition-all duration-700"
                                style={{ width: `${scorePercentage}%` }}
                            />
                            <div
                                className="bg-red h-full transition-all duration-700"
                                style={{ width: `${100 - scorePercentage}%` }}
                            />
                        </div>
                        <div className="flex flex-row justify-between w-full font-semibold text-lg px-4">
                            <p className="text-emerald-600">{score} Correct</p>
                            <p className="text-red">{totalQuestions - score} Incorrect</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full max-w-md justify-center">
                    {quizId && (
                        <Link
                            href={`/quizzes/${quizId}/history`}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-300 dark:hover:bg-dark-400 text-dark-100 rounded-2xl font-bold transition-all w-full sm:w-auto shadow-xs"
                        >
                            <History className="h-5 w-5 text-brand" />
                            <span>View Attempt History</span>
                        </Link>
                    )}
                    <Button
                        onClick={handleBack}
                        className="px-8 py-6 bg-brand hover:bg-emerald-500 text-white rounded-2xl font-bold text-base transition-all w-full sm:w-auto shadow-sm cursor-pointer"
                    >
                        Return to Quizzes
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default QuizSubmission;