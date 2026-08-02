import { getCreatedFlashcards, getDueFlashcardsCount, getFlashcardReviewStats, getDecksByDocument } from "@/lib/actions/ai.actions";
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

    const documents = filesData?.documents || [];
    
    // Fetch deck summaries for all documents
    const deckSummariesNested = await Promise.all(
        documents.map(doc => getDecksByDocument(doc.id).catch(() => []))
    );
    const deckSummaries = deckSummariesNested.flat();

    // Group raw flashcards by deckId
    interface FlashcardItem {
        deckId: string;
        createdAt?: string;
        front?: string;
        back?: string;
    }

    const cardsByDeck = (flashcards || []).reduce((acc, card: FlashcardItem) => {
        if (!acc[card.deckId]) acc[card.deckId] = [];
        acc[card.deckId].push(card);
        return acc;
    }, {} as Record<string, FlashcardItem[]>);

    const fileMap = documents.reduce((acc, doc) => {
        acc[doc.id] = doc.fileName;
        return acc;
    }, {} as Record<string, string>);

    // Map Deck Summaries to DeckItem format for the UI
    const decks: DeckItem[] = deckSummaries.map(summary => ({
        deckId: summary.deckId,
        deckTitle: summary.deckTitle || "Untitled Deck",
        documentId: summary.documentId,
        documentName: fileMap[summary.documentId] || "Unknown Document",
        cards: cardsByDeck[summary.deckId] || [],
        createdAt: summary.createdAt
    }));

    return (
        <FlashcardsDashboardClient
            initialDecks={decks}
            actualDueCount={actualDueCount}
            stats={stats}
        />
    );
}