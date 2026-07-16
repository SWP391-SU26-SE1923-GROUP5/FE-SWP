import React from "react";
import { getCreatedQuizzes } from "@/lib/actions/ai.actions";
import { QuizRecord } from "@/types";
import QuizzesDashboardClient from "./QuizzesDashboardClient";

export const dynamic = "force-dynamic";

export default async function QuizDashboard() {
    let quizzes: QuizRecord[] = [];
    try {
        quizzes = await getCreatedQuizzes();
    } catch (error) {
        console.error("Failed to load quizzes:", error);
    }

    return (
        <main className="min-h-screen bg-light-800 dark:bg-dark-100 transition-colors">
            <QuizzesDashboardClient initialQuizzes={quizzes || []} />
        </main>
    );
}