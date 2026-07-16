import { getQuizById } from "@/lib/actions/ai.actions";
import QuizQuestions from "./QuizQuestions";
import { QuizResponse } from "@/types";

type Props = {
    params: Promise<{
        quizId: string;
    }>;
};

export default async function QuizPage({ params }: Props) {
    const { quizId } = await params;

    let quizData: QuizResponse | null = null;
    let hasError = false;

    try {
        quizData = await getQuizById(quizId);
    } catch (error) {
        console.error("Failed to load existing quiz:", error);
        hasError = true;
    }

    if (hasError) {
        return (
            <div className="flex h-screen items-center justify-center text-red">
                An error occurred while loading the quiz.
            </div>
        );
    }

    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500">
                This quiz has no questions available.
            </div>
        );
    }

    return <QuizQuestions quizData={quizData} quizId={quizId} />;
}