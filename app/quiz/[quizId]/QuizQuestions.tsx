"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import { ChevronLeft, X, Sparkles } from "lucide-react";
import QuizSubmission from "@/components/QuizSubmission";
import { useRouter } from "next/navigation";
import { QuizResponse } from "@/types";

type Props = {
    quizData: QuizResponse;
};

export default function QuizQuestions({ quizData }: Props) {
    const [started, setStarted] = useState<boolean>(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState<boolean>(false);

    const router = useRouter();
    const questions = quizData.questions || [];

    const handleNext = () => {
        if (!started) {
            setStarted(true);
            return;
        }

        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx((prev) => prev + 1);
        } else {
            setSubmitted(true);
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
                score={score}
                scorePercentage={scorePercentage}
                totalQuestions={questions.length}
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

                    <div className="flex-1">
                        <ProgressBar value={started ? ((currentQuestionIdx + 1) / questions.length) * 100 : 0} />
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
                        disabled={started && !hasAnswered}
                    >
                        {!started
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