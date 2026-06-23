import { getCreatedFlashcards } from "@/lib/actions/ai.actions";
import FlashcardViewer from "./FlashcardViewer";

type Props = { params: Promise<{ flashcardId: string }> };

export default async function FlashcardStudyPage({ params }: Props) {
    const { flashcardId } = await params;

    const allFlashcards = await getCreatedFlashcards();
    const deckCards = allFlashcards.filter(card => card.documentId === flashcardId);

    if (!deckCards || deckCards.length === 0) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <p className="text-light-400">No flashcards found for this document.</p>
            </div>
        );
    }

    return (
        <div className="p-6 w-full max-w-4xl mx-auto flex flex-col items-center pt-20">
            <FlashcardViewer cards={deckCards} />
        </div>
    );
}