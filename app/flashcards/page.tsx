import { getCreatedFlashcards } from "@/lib/actions/ai.actions";
import { getFiles } from "@/lib/actions/file.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, ArrowLeft } from "lucide-react";

export default async function FlashcardsPage() {
    const flashcards = await getCreatedFlashcards();

    if (!flashcards || flashcards.length === 0) {
        return (
            <div className="p-6 w-full max-w-7xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" asChild className="flex items-center gap-2 text-light-400 hover:text-dark-100 cursor-pointer w-fit -ml-4">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Link>
                    </Button>
                </div>
                <div className="p-8 text-center text-light-400 mt-10">
                    <p>No flashcards generated yet. Upload a document to get started!</p>
                </div>
            </div>
        );
    }

    const filesData = await getFiles({ types: [], limit: 100 });
    const fileMap = (filesData?.documents || []).reduce((acc, file) => {
        acc[file.id] = file.fileName;
        return acc;
    }, {} as Record<string, string>);

    const groupedDecks = flashcards.reduce((acc, card) => {
        if (!acc[card.documentId]) {
            acc[card.documentId] = {
                documentId: card.documentId,
                cards: [],
            };
        }
        acc[card.documentId].cards.push(card);
        return acc;
    }, {} as Record<string, { documentId: string; cards: typeof flashcards }>);

    const decks = Object.values(groupedDecks);

    return (
        <div className="p-6 w-full max-w-7xl mx-auto">
            <div className="mb-6">
                <Button variant="ghost" asChild className="flex items-center gap-2 text-light-400 hover:text-dark-100 cursor-pointer w-fit -ml-4">
                    <Link href="/home">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </Button>
            </div>

            <h1 className="h1 text-dark-100 mb-8">My Flashcard Collections</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => {
                    const documentName = fileMap[deck.documentId] || "Document Deck";

                    return (
                        <Link href={`/flashcard/${deck.documentId}`} key={deck.documentId}>
                            <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-brand hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[200px]">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-brand-100 rounded-xl text-brand group-hover:bg-brand group-hover:text-white transition-colors shrink-0">
                                            <Layers className="h-6 w-6" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand-100 px-3 py-1 rounded-full">
                                            {deck.cards.length} Cards
                                        </span>
                                    </div>
                                    <h3 className="h3-bold mb-2 line-clamp-1" title={documentName}>
                                        {documentName}
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-4 font-mono truncate">
                                        ID: {deck.documentId.split('-')[0]}...
                                    </p>
                                </div>

                                <Button className="w-full cursor-pointer">Study Collection</Button>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}