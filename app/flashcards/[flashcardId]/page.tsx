import { getFlashcardsByDocument, getDueFlashcards } from "@/lib/actions/ai.actions";
import FlashcardViewer from "./FlashcardViewer";
import { Flashcard } from "@/types";

type Props = { params: Promise<{ flashcardId: string }> };

export default async function FlashcardStudyPage({ params }: Props) {
    const { flashcardId } = await params;

    let deckCards: Flashcard[] = [];

    if (flashcardId === "due") {
        const dueCards = await getDueFlashcards(50);
        deckCards = (dueCards || []).map((c: any) => ({
            id: c.flashcardId || c.id,
            documentId: c.documentId || "",
            front: c.front || "",
            back: c.back || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));
    } else {
        deckCards = await getFlashcardsByDocument(flashcardId);
    }

    if (!deckCards || deckCards.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh] text-center gap-4 animate-in fade-in duration-500">
                <div className="p-6 bg-brand/10 rounded-full mb-2">
                    <span className="text-4xl">🎉</span>
                </div>
                <h2 className="h2 font-bold text-dark100_light900">All caught up!</h2>
                <p className="body-2 text-light-200 dark:text-dark-400 max-w-md">
                    No flashcards found or due for review right now. You're doing great! Check back later for your next scheduled reviews.
                </p>
                <a href="/flashcards" className="mt-4 px-6 py-3 bg-brand text-white font-bold rounded-full shadow-drop-1 hover:bg-brand-100 transition-all">
                    Back to Dashboard
                </a>
            </div>
        );
    }

    return (
        <div className="p-6 w-full max-w-4xl mx-auto flex flex-col items-center pt-20">
            <FlashcardViewer cards={deckCards} />
        </div>
    );
}