"use client";

import React, { useState } from "react";
import { RotateCcw, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Flashcard } from "@/types";
import { deleteFlashcard } from "@/lib/actions/ai.actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function FlashcardViewer({ cards: initialCards }: { cards: Flashcard[] }) {
    const [cards, setCards] = useState<Flashcard[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

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
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        setIsFlipped(false);
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

                <span className="text-sm font-medium text-slate-500">
                    Card {currentIndex + 1} of {cards.length}
                </span>

                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 rounded-full cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </div>

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
                    Click card to flip
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