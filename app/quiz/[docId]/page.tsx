import { generateQuiz } from "@/lib/actions/ai.actions";
import QuizQuestions from "./QuizQuestions";
import { QuizResponse } from "@/types";

type Props = {
    params: {
        docId: string;
    };
};

export default async function QuizPage({ params }: Props) {
    let quizData: QuizResponse | null = null;
    let hasError = false;

    try {
        quizData = await generateQuiz(params.docId, 10);
    } catch (error) {
        console.error("Failed to load quiz page:", error);
        hasError = true;
    }

    if (hasError) {
        return (
            <div className="flex h-screen items-center justify-center text-red">
                An error occurred while generating the quiz.
            </div>
        );
    }

    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center text-slate-500">
                Failed to generate quiz questions for this document.
            </div>
        );
    }

    return <QuizQuestions quizData={quizData} />;
}