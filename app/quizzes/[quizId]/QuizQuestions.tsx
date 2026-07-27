"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import { ChevronLeft, X, Sparkles, Clock } from "lucide-react";
import QuizSubmission from "@/components/QuizSubmission";
import { useRouter } from "next/navigation";
import { QuizResponse } from "@/types";
import { submitQuiz } from "@/lib/actions/ai.actions";

type Props = {
    quizData: QuizResponse;
    quizId?: string;
};

export default function QuizQuestions({ quizData, quizId }: Props) {
    const [started, setStarted] = useState<boolean>(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [xpEarned, setXpEarned] = useState<number>(0);
    interface Achievement {
        title: string;
        description?: string;
        xpReward?: number;
        id?: string;
        icon?: string;
    }

    interface LevelUpToast {
        newLevel: number;
        title?: string;
        message?: string;
    }

    const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
    const [levelUpToast, setLevelUpToast] = useState<LevelUpToast | null>(null);
    const [startTime] = useState<number>(Date.now);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (started && !submitted && !isSubmitting) {
            interval = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [started, submitted, isSubmitting]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const router = useRouter();
    const questions = quizData.questions || [];

    const handleNext = async () => {
        if (!started) {
            setStarted(true);
            return;
        }

        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx((prev) => prev + 1);
        } else {
            setIsSubmitting(true);
            try {
                if (quizId) {
                    const formattedAnswers: Record<string, string> = {};
                    questions.forEach((q, idx) => {
                        const ansIdx = userAnswers[idx];
                        if (ansIdx !== undefined && q.answers[ansIdx]) {
                            const qKey = q.id || String(idx);
                            formattedAnswers[qKey] = q.answers[ansIdx].selectedOption;
                        }
                    });
                    const durationSeconds = Math.max(1, elapsedSeconds || Math.round((Date.now() - startTime) / 1000));
                    const result = (await submitQuiz(quizId, formattedAnswers, durationSeconds)) as {
                        data?: { score?: number; totalCorrect?: number; levelUpToast?: LevelUpToast };
                        submission?: { score?: number; totalCorrect?: number; levelUpToast?: LevelUpToast };
                        xpEarned?: number;
                        newAchievements?: Achievement[];
                        levelUpToast?: LevelUpToast | null;
                        currentLevel?: number;
                    } | null | undefined;
                    if (result) {
                        const subData = result.data || result.submission;
                        if (subData) {
                            if (subData.score !== undefined) {
                                setScore(subData.score);
                            } else if (subData.totalCorrect !== undefined) {
                                setScore(subData.totalCorrect);
                            }
                        }
                        if (result.xpEarned !== undefined) setXpEarned(result.xpEarned);
                        if (result.newAchievements !== undefined) setNewAchievements(result.newAchievements);
                        if (result.levelUpToast || subData?.levelUpToast) {
                            setLevelUpToast(result.levelUpToast || subData?.levelUpToast || null);
                        } else if ((result.currentLevel ?? 0) > 0 && (result.xpEarned ?? 0) > 0 && result.levelUpToast !== null) {
                            if (result.levelUpToast) setLevelUpToast(result.levelUpToast);
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsSubmitting(false);
                setSubmitted(true);
            }
        }
    };

    const handleAnswer = (answerIndex: number, isCorrect: boolean) => {
        setUserAnswers((prev) => ({
            ...prev,
            [currentQuestionIdx]: answerIndex
        }));

        if (isCorrect) {
            setScore((prev) => prev + 1);
        }
    };

    const handlePressPrevious = () => {
        if (currentQuestionIdx !== 0) {
            setCurrentQuestionIdx((prev) => prev - 1);
        }
    };

    const handleExit = () => {
        router.back();
    };

    if (submitted) {
        const scorePercentage = questions.length > 0
            ? Math.round((score / questions.length) * 100)
            : 0;

        return (
            <QuizSubmission
                quizId={quizId}
                score={score}
                scorePercentage={scorePercentage}
                totalQuestions={questions.length}
                xpEarned={xpEarned}
                newAchievements={newAchievements}
                levelUpToast={levelUpToast}
            />
        );
    }

    const activeQuestion = questions[currentQuestionIdx];
    const selectedAnswerIndex = userAnswers[currentQuestionIdx];
    const hasAnswered = selectedAnswerIndex !== undefined;

    return (
        <div className="flex flex-col flex-1 h-full">
            <div className="sticky top-0 z-10 py-4 w-full bg-white/80 backdrop-blur-md">
                <header className="flex items-center justify-between gap-6">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={handlePressPrevious}
                        disabled={currentQuestionIdx === 0 || !started}
                        className="rounded-full shrink-0 cursor-pointer"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex-1 flex items-center gap-4">
                        <div className="flex-1">
                            <ProgressBar value={started ? ((currentQuestionIdx + 1) / questions.length) * 100 : 0} />
                        </div>
                        {started && (
                            <div className="flex items-center gap-1.5 px-3.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-mono font-bold shadow-inner border border-slate-200 shrink-0">
                                <Clock className="h-3.5 w-3.5 text-brand animate-pulse" />
                                <span>{formatTime(elapsedSeconds)}</span>
                            </div>
                        )}
                    </div>

                    <Button
                        size="icon"
                        variant="outline"
                        onClick={handleExit}
                        className="rounded-full shrink-0 cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </header>
            </div>

            <main className="flex flex-col justify-center flex-1 mt-8 mb-24">
                {!started ? (
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Sparkles className="h-12 w-12 text-brand animate-pulse" />
                        <h1 className="text-4xl font-bold text-dark-100">{quizData.quizTitle}</h1>
                        <p className="text-light-200">Generated from your document.</p>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl mx-auto animation-fade-in">
                        <p className="text-sm font-semibold text-brand mb-3 uppercase tracking-widest">
                            Question {currentQuestionIdx + 1} of {questions.length}
                        </p>
                        <h2 className="text-2xl font-bold text-dark-200 leading-snug">
                            {activeQuestion.questionTitle}
                        </h2>

                        <div className="grid grid-cols-1 gap-4 mt-8">
                            {activeQuestion.answers.map((answer, i) => {
                                let btnClasses = "w-full p-6 text-left justify-start text-base border-2 rounded-2xl transition-all ";

                                if (!hasAnswered) {
                                    btnClasses += "cursor-pointer bg-white hover:bg-brand/5 hover:border-brand text-dark-200 border-slate-200";
                                } else {
                                    if (answer.isCorrect) {
                                        btnClasses += "bg-emerald-50 border-emerald-500 text-emerald-800";
                                    } else if (i === selectedAnswerIndex) {
                                        btnClasses += "bg-red/10 border-red text-red";
                                    } else {
                                        btnClasses += "bg-white border-slate-100 text-slate-400 opacity-60";
                                    }
                                }

                                return (
                                    <button
                                        key={i}
                                        disabled={hasAnswered}
                                        onClick={() => handleAnswer(i, answer.isCorrect)}
                                        className={btnClasses}
                                    >
                                        {answer.selectedOption}
                                    </button>
                                );
                            })}
                        </div>

                        {hasAnswered && (
                            <div className={`mt-8 p-4 rounded-xl border font-medium ${
                                activeQuestion.answers[selectedAnswerIndex]?.isCorrect
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-red/10 border-red/20 text-red"
                            }`}>
                                {activeQuestion.answers[selectedAnswerIndex]?.isCorrect
                                    ? "✨ Correct!"
                                    : `❌ Incorrect. The correct answer was: ${activeQuestion.answers.find(a => a.isCorrect)?.selectedOption}`}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="fixed bottom-0 left-0 w-full p-6 bg-white border-t border-slate-100 z-10 flex justify-center">
                <div className="max-w-3xl w-full flex justify-end">
                    <Button
                        className="w-full sm:w-auto px-12 py-6 text-lg rounded-full bg-brand text-white hover:bg-brand-100 transition-colors cursor-pointer"
                        onClick={handleNext}
                        disabled={(started && !hasAnswered) || isSubmitting}
                    >
                        {isSubmitting
                            ? "Submitting..."
                            : !started
                                ? "Begin Quiz"
                                : currentQuestionIdx === questions.length - 1
                                    ? "Submit Results"
                                    : "Next Question"}
                    </Button>
                </div>
            </footer>
        </div>
    );
}