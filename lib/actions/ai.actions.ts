"use server";

import { auth } from "@/auth";
import {
    SummaryResponse,
    Flashcard,
    QuizResponse,
    QuizRecord
} from "@/types";
import { revalidatePath } from "next/cache";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export interface ChatSession {
    id: string;
    userId: string;
    documentId: string | null;
    sessionTitle: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    chatSessionId: string;
    sender: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface RAGReference {
    index: number;
    documentId: string;
    documentTitle: string;
    pageInfo: string;
    chunkExcerpt: string;
}

export interface RAGCitation {
    index: number;
    documentTitle: string;
    chunkPreview: string;
}

export interface RAGResponse {
    answer: string;
    citations?: RAGCitation[];
    references?: RAGReference[];
    neighbors?: any[];
}

export interface Citation {
    source: string;
    content: string;
    relevance: number;
}

export interface SemanticSearchResponse {
    answer: string;
    citations: Citation[];
    confidence: number;
}

export const getUserSessions = async (): Promise<ChatSession[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Chat/sessions`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch chat sessions."}`);
    }

    return await response.json();
};

export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Chat/sessions/${sessionId}/messages`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch chat messages."}`);
    }

    return await response.json();
};

export const createChatSession = async (
    documentId: string | null = null,
    sessionTitle: string = "New Chat Session"
): Promise<ChatSession> => {
    const session = await auth();
    if (!session?.accessToken || !session?.user?.id) {
        throw new Error("Unauthorized. Please log in.");
    }

    const response = await fetch(`${connection_url}/api/Chat/sessions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: session.user.id,
            documentId: documentId,
            sessionTitle: sessionTitle
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to create chat session."}`);
    }

    return await response.json();
};

export const semanticSearch = async (
    question: string
): Promise<SemanticSearchResponse> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Rag/ask`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: question
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Semantic search failed."}`);
    }

    return await response.json();
};

export const summarizeDocument = async (documentId: string): Promise<SummaryResponse> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/chat/summarize`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            documentId: documentId
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to generate document summary."}`);
    }

    return await response.json();
};

export const generateFlashcards = async (docId: string, numberOfFlashcards: number = 5): Promise<Flashcard[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/flashcard/document/${docId}/ai-gen`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            numberOfFlashcards: numberOfFlashcards
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to generate flashcards."}`);
    }

    return await response.json();
};

export const generateQuiz = async (docId: string, numberOfQuestions: number = 5): Promise<QuizResponse> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/quiz/document/${docId}/ai-gen`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            numberOfQuestions: numberOfQuestions
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to generate quiz."}`);
    }

    return await response.json();
};

export const getCreatedQuizzes = async (): Promise<QuizRecord[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Quiz`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch quizzes."}`);
    }

    const data = await response.json();
    return data?.items || [];
};

export const getQuizById = async (quizId: string): Promise<QuizResponse> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Quiz/${quizId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || "Failed to fetch quiz."}`);
    }

    const data = await response.json();

    return {
        quizTitle: data.title,
        questions: data.questions?.map((q: any) => ({
            questionTitle: q.title,
            answers: q.answers || []
        })) || []
    };
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Quiz/${quizId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || "Failed to delete quiz."}`);
    }

    revalidatePath("/quizzes");
};