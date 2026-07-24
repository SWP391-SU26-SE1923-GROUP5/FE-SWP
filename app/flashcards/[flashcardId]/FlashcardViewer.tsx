"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Flashcard } from "@/types";
import { deleteFlashcard, submitFlashcardReview } from "@/lib/actions/ai.actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function FlashcardViewer({ cards: initialCards }: { cards: Flashcard[] }) {
    const [cards, setCards] = useState<Flashcard[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSchedule, setLastSchedule] = useState<{ interval: number; date: string } | null>(null);
    const [cardSeconds, setCardSeconds] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isSubmitting && !isDeleting) {
                setCardSeconds((prev) => prev + 1);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isSubmitting, isDeleting]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    if (cards.length === 0) {
        return (
            <div className="text-center">
                <p className="text-light-400 mb-4">You have completed or deleted all cards in this deck.</p>
                <Button onClick={() => router.push("/flashcards")} className="cursor-pointer">
                    Return to Collections
                </Button>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setCardSeconds(0);
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCardSeconds(0);
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteFlashcard(currentCard.id);

            const updatedCards = cards.filter((_, index) => index !== currentIndex);
            setCards(updatedCards);

            if (currentIndex >= updatedCards.length && updatedCards.length > 0) {
                setCurrentIndex(updatedCards.length - 1);
            }
            setIsFlipped(false);
        } catch (error) {
            console.error("Failed to delete flashcard:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    interface ReviewResponse {
        review?: { interval?: number; nextReviewDate?: string };
        Review?: { interval?: number; nextReviewDate?: string };
        xpEarned?: number;
    }

    async function handleReview(quality: number, e: React.MouseEvent) {
        e.stopPropagation();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const timeSpent = Math.max(1, cardSeconds);
            const res = await submitFlashcardReview(currentCard.id, quality, timeSpent) as ReviewResponse;
            const rev = res?.review || res?.Review;
            if (rev && typeof rev.interval !== "undefined") {
                const dateStr = rev.nextReviewDate ? new Date(rev.nextReviewDate).toLocaleDateString() : "";
                setLastSchedule({ interval: rev.interval, date: dateStr });
                const scheduleMsg = rev.interval <= 1 ? " • Next: Tomorrow" : ` • Next in ${rev.interval} days`;
                const xpMsg = (res?.xpEarned ?? 0) > 0 ? ` (+${res.xpEarned} XP)` : "";
                toast.success(`Review recorded!${scheduleMsg}${xpMsg}`);
            } else {
                const xpMsg = (res?.xpEarned ?? 0) > 0 ? ` (+${res.xpEarned} XP)` : "";
                toast.success(`Review recorded!${xpMsg}`);
            }
            if (currentIndex < cards.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
                setCardSeconds(0);
            } else {
                toast.success("Deck study completed!");
            }
        } catch (error) {
            toast.error("Failed to record review.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col items-center w-full max-w-2xl">
            <div className="w-full flex justify-between items-center mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/flashcards")}
                    className="flex items-center gap-2 text-light-400 hover:text-dark-100 cursor-pointer"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Collections
                </Button>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">
                        Card {currentIndex + 1} of {cards.length}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-mono font-bold shadow-inner border border-slate-200">
                        <Clock className="h-3.5 w-3.5 text-brand animate-pulse" />
                        <span>{formatTime(cardSeconds)}</span>
                    </div>
                </div>

                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 rounded-full cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </div>

            {lastSchedule && (
                <div className="w-full mb-6 px-4 py-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-medium border border-emerald-200 flex items-center justify-between shadow-sm">
                    <span>💡 <strong>SM-2 Schedule:</strong> Previous card scheduled for review {lastSchedule.interval <= 1 ? "tomorrow" : `in ${lastSchedule.interval} days`} {lastSchedule.date && `(${lastSchedule.date})`}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Spaced Repetition</span>
                </div>
            )}

            <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative cursor-pointer w-full min-h-[400px] p-10 rounded-[2rem] border flex flex-col items-center justify-center text-center transition-all duration-500 transform shadow-sm ${
                    isFlipped
                        ? "bg-brand text-white border-brand shadow-drop-1"
                        : "bg-white text-dark-200 border-slate-200 hover:border-brand"
                }`}
            >
                <RotateCcw
                    className={`absolute top-6 right-6 opacity-40 transition-transform duration-500 ${
                        isFlipped ? "rotate-180 text-white" : "text-brand"
                    }`}
                />

                <span className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-widest opacity-50">
                    {isFlipped ? "Back (Definition)" : "Front (Term)"}
                </span>

                <p className={`font-medium px-4 leading-relaxed ${isFlipped ? "text-lg" : "text-3xl"}`}>
                    {isFlipped ? currentCard.back : currentCard.front}
                </p>
            </div>

            {isFlipped && (
                <div className="mt-6 w-full flex flex-col items-center gap-3">
                    <p className="text-sm font-semibold text-slate-600">Rate your recall quality:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={(e) => handleReview(0, e)}
                            disabled={isSubmitting}
                            className="border-red-200 text-red hover:bg-red hover:text-white rounded-xl py-6 font-semibold cursor-pointer transition-colors"
                        >
                            Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={(e) => handleReview(1, e)}
                            disabled={isSubmitting}
                            className="border-amber-200 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl py-6 font-semibold cursor-pointer transition-colors"
                        >
                            Hard
                        </Button>
                        <Button
                            variant="outline"
                            onClick={(e) => handleReview(2, e)}
                            disabled={isSubmitting}
                            className="border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl py-6 font-semibold cursor-pointer transition-colors"
                        >
                            Good
                        </Button>
                        <Button
                            variant="outline"
                            onClick={(e) => handleReview(3, e)}
                            disabled={isSubmitting}
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl py-6 font-semibold cursor-pointer transition-colors"
                        >
                            Easy
                        </Button>
                    </div>
                </div>
            )}

            <div className="mt-8 w-full flex justify-between items-center px-4">
                <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 rounded-full px-6 cursor-pointer"
                >
                    <ChevronLeft className="h-4 w-4" /> Previous
                </Button>

                <p className="text-sm text-light-400">
                    {isFlipped ? "Select a rating to submit review" : "Click card to flip"}
                </p>

                <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    className="flex items-center gap-2 rounded-full px-6 cursor-pointer"
                >
                    Next <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}