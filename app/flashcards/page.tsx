import { getCreatedFlashcards } from "@/lib/actions/ai.actions";
import { getFiles } from "@/lib/actions/file.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, ChevronLeft } from "lucide-react";

export default async function FlashcardsPage() {
    const flashcards = await getCreatedFlashcards();
    const filesData = await getFiles({ types: [], limit: 100 });

    const fileMap = (filesData?.documents || []).reduce((acc, file) => {
        acc[file.id] = file.fileName;
        return acc;
    }, {} as Record<string, string>);

    const groupedDecks = (flashcards || []).reduce((acc, card) => {
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
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col flex-1 h-full">
            <div className="mb-8">
                <Link
                    href="/home"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" /> Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-dark-200 tracking-tight">
                    Your Flashcards
                </h1>
                <p className="text-slate-500 mt-2">
                    Review and study your previously generated flashcard collections.
                </p>
            </div>

            {!flashcards || flashcards.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Layers className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-dark-100 mb-2">No flashcards yet</h3>
                    <p className="text-slate-500 max-w-sm mb-6">
                        You haven&#39;t generated any flashcards. Select a document from your home dashboard to start studying!
                    </p>
                    <Link
                        href="/home"
                        className="px-6 py-3 bg-brand text-white rounded-full font-medium transition-all shadow-sm [&:hover]:bg-emerald-400 [&:hover]:shadow-md"
                    >
                        Go to Home to Select a Document
                    </Link>
                </div>
            ) : (
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
            )}
        </div>
    );
}