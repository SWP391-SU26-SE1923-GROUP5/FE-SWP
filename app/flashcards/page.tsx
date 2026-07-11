import { getCreatedFlashcards, getDueFlashcardsCount, getFlashcardReviewStats } from "@/lib/actions/ai.actions";
import { getFiles } from "@/lib/actions/file.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, ChevronLeft, Sparkles, Clock, Flame, Award, BrainCircuit } from "lucide-react";

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
                cards: [],
            };
        }
        acc[card.documentId].cards.push(card);
        return acc;
    }, {} as Record<string, { documentId: string; cards: any[] }>);

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
                    Review and study your generated flashcard collections powered by SM-2 Spaced Repetition.
                </p>
            </div>

            {/* SM-2 Spaced Repetition Banner & Stats */}
            <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Due Today Hero Card */}
                <div className="lg:col-span-1 p-6 rounded-3xl bg-gradient-to-br from-brand to-emerald-600 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5" /> SM-2 Spaced Repetition
                        </div>
                        <h2 className="text-2xl font-extrabold mb-1">Due For Review</h2>
                        <p className="text-emerald-100 text-sm mb-6">
                            Cards scheduled for practice today based on your memory retention curve.
                        </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div>
                            <span className="text-3xl font-black">{actualDueCount}</span>
                            <span className="text-xs text-emerald-100 ml-1.5 uppercase font-medium">Cards</span>
                        </div>
                        <Link href="/flashcards/due">
                            <Button
                                variant="secondary"
                                disabled={actualDueCount === 0}
                                className="bg-white text-brand hover:bg-emerald-50 font-bold rounded-xl px-5 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {actualDueCount > 0 ? "Study Now" : "All Done!"}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-3">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-200">{stats?.totalReviewed ?? 0}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Total Reviewed</p>
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-3">
                            <Flame className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-200">{actualDueCount}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Due Today</p>
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-3">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-200">{stats?.masteredCount ?? 0}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Mastered Cards</p>
                        </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between shadow-sm">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-3">
                            <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-dark-200">
                                {stats?.averageEaseFactor ? stats.averageEaseFactor.toFixed(2) : "2.50"}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Avg Ease Factor</p>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-dark-200 mb-6">Document Decks</h2>

            {!flashcards || flashcards.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl w-full">
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
                            <Link href={`/flashcards/${deck.documentId}`} key={deck.documentId}>
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