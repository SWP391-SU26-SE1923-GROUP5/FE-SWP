import { getCreatedFlashcards, getDueFlashcardsCount, getFlashcardReviewStats } from "@/lib/actions/ai.actions";
import { getFiles } from "@/lib/actions/file.actions";
import FlashcardsDashboardClient, { DeckItem } from "./FlashcardsDashboardClient";

export default async function FlashcardsPage() {
    const [flashcards, filesData, dueCount, stats] = await Promise.all([
        getCreatedFlashcards().catch(() => []),
        getFiles({ types: [], limit: 100 }).catch(() => ({ documents: [] })),
        getDueFlashcardsCount().catch(() => 0),
        getFlashcardReviewStats().catch(() => null)
    ]);

    const actualDueCount = typeof dueCount === 'number' ? dueCount : (stats?.dueNow || 0);

    const fileMap = (filesData?.documents || []).reduce((acc, file) => {
        acc[file.id] = file.fileName;
        return acc;
    }, {} as Record<string, string>);

    const groupedDecks = (flashcards || []).reduce((acc, card) => {
        if (!acc[card.documentId]) {
            acc[card.documentId] = {
                documentId: card.documentId,
                documentName: fileMap[card.documentId] || "Document Deck",
                cards: [],
                createdAt: card.createdAt
            };
        }
        acc[card.documentId].cards.push(card);
        return acc;
    }, {} as Record<string, DeckItem>);

    const decks: DeckItem[] = Object.values(groupedDecks);

    return (
        <FlashcardsDashboardClient
            initialDecks={decks}
            actualDueCount={actualDueCount}
            stats={stats}
        />
    );
}