import { getCreatedQuizzes } from "@/lib/actions/ai.actions"; // Adjust import path
import Link from "next/link";
import { BrainCircuit, Clock } from "lucide-react";

export default async function QuizDashboard() {
    const quizzes = await getCreatedQuizzes();

    if (!quizzes || quizzes.length === 0) {
        return (
            <div className="p-8 text-center text-light-400">
                <p>No quizzes generated yet. Upload a document to get started!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {quizzes.map((quiz) => (
                <Link href={`/quiz/${quiz.id}`} key={quiz.id}>
                    <div className="p-5 border border-slate-200 rounded-xl bg-white hover:border-brand hover:shadow-sm transition-all cursor-pointer group">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-brand-100 rounded-lg text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                                <BrainCircuit className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-dark-100 line-clamp-2">
                                {quiz.title}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-light-400 mt-4 pt-4 border-t border-slate-100">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}