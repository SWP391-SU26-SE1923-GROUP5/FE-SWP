import { getCreatedQuizzes, deleteQuiz } from "@/lib/actions/ai.actions";
import Link from "next/link";
import { BrainCircuit, Clock, ChevronLeft, Trash2 } from "lucide-react";

export default async function QuizDashboard() {
    const quizzes = await getCreatedQuizzes();

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
                    Your Quizzes
                </h1>
                <p className="text-slate-500 mt-2">
                    Review and retake your previously generated quizzes.
                </p>
            </div>

            {!quizzes || quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl w-full">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <BrainCircuit className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-dark-100 mb-2">No quizzes yet</h3>
                    <p className="text-slate-500 max-w-sm mb-6">
                        You haven&#39;t generated any quizzes. Select a document from your home dashboard to test your knowledge!
                    </p>
                    <Link
                        href="/home"
                        className="px-6 py-3 bg-brand text-white rounded-full font-medium transition-all shadow-sm [&:hover]:bg-emerald-400 [&:hover]:shadow-md"
                    >
                        Go to Home to Select a Document
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="relative group flex flex-col h-full border border-slate-200 rounded-2xl bg-white hover:border-brand hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

                            <Link href={`/quizzes/${quiz.id}`} className="flex flex-col flex-1 p-6">
                                <div className="flex items-start gap-4 mb-4 pr-10">
                                    <div className="p-3 bg-brand/10 rounded-xl text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                                        <BrainCircuit className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-lg text-dark-200 leading-snug line-clamp-2 mt-1">
                                        {quiz.title}
                                    </h3>
                                </div>

                                <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            {new Date(quiz.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-brand opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        Start &rarr;
                                    </span>
                                </div>
                            </Link>

                            <form
                                action={async () => {
                                    "use server";
                                    await deleteQuiz(quiz.id);
                                }}
                                className="absolute top-4 right-4 z-20"
                            >
                                <button
                                    type="submit"
                                    className="flex items-center justify-center h-8 w-8 text-slate-400 bg-slate-100 [&:hover]:text-white [&:hover]:bg-red rounded-full transition-all cursor-pointer shadow-sm [&:hover]:shadow-md"
                                    title="Delete Quiz"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </form>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}