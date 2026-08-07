import React from "react";
import { getQuizzesByDocument } from "@/lib/actions/ai.actions";
import { getFiles } from "@/lib/actions/file.actions";
import QuizzesDashboardClient, { DocumentQuizzes } from "./QuizzesDashboardClient";

export const dynamic = "force-dynamic";

export default async function QuizDashboard() {
    const filesData = await getFiles({ types: [], limit: 100 }).catch(() => ({ documents: [] }));
    const documents = filesData?.documents || [];

    const quizzesNested = await Promise.all(
        documents.map(async doc => {
            const res = await getQuizzesByDocument(doc.id).catch(() => []);
            if (!Array.isArray(res)) return [];
            return res;
        })
    );
    const allQuizzes = quizzesNested.flat();

    const fileMap = documents.reduce((acc, doc) => {
        acc[doc.id] = doc.fileName;
        return acc;
    }, {} as Record<string, string>);

    const quizzesByDoc = allQuizzes.reduce((acc, quiz) => {
        if (!acc[quiz.documentId]) acc[quiz.documentId] = [];
        acc[quiz.documentId].push(quiz);
        return acc;
    }, {} as Record<string, typeof allQuizzes>);

    const documentQuizzes: DocumentQuizzes[] = Object.keys(quizzesByDoc).map(docId => ({
        documentId: docId,
        documentName: fileMap[docId] || "Unknown Document",
        quizzes: quizzesByDoc[docId]
    }));

    return (
        <main className="min-h-screen bg-light-800 dark:bg-dark-100 transition-colors">
            <QuizzesDashboardClient initialDocumentQuizzes={documentQuizzes} />
        </main>
    );
}