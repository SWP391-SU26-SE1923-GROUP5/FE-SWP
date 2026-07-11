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
            <div className="flex flex-col justify-center items-center h-[50vh] text-center gap-3">
                <p className="text-xl font-bold text-dark-100">🎉 All caught up!</p>
                <p className="text-slate-500 max-w-sm">No flashcards found or due for review right now. Check back later!</p>
            </div>
        );
    }

    return (
        <div className="p-6 w-full max-w-4xl mx-auto flex flex-col items-center pt-20">
            <FlashcardViewer cards={deckCards} />
        </div>
    );
}