"use server";

import { auth } from "@/auth";
import {
    SummaryResponse,
    Flashcard,
    QuizResponse, QuizRecord
} from "@/types"; // Adjust path if your types file is located elsewhere

const connection_url = process.env.NEXT_PUBLIC_API_URL;

// ==========================================
// 1. CHAT-SPECIFIC TYPES
// ==========================================

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    neighbors?: any[];
}

// ==========================================
// 2. CHAT & RAG ACTIONS
// ==========================================

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
        const errorText = await response.text();
        console.error("[GET Sessions Error]:", response.status, errorText);
        throw new Error("Failed to fetch chat sessions.");
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
        const errorText = await response.text();
        console.error(`[GET Messages Error for Session ${sessionId}]:`, response.status, errorText);
        throw new Error("Failed to fetch chat messages.");
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
        const errorText = await response.text();
        console.error("[POST Session Error]:", response.status, errorText);
        throw new Error("Failed to create chat session.");
    }

    return await response.json();
};

export const sendChatMessage = async (
    message: string,
    sessionId: string,
    documentIds: string[] = [],
    includeDocuments: boolean = true
): Promise<RAGResponse> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Chat/rag`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            sessionId: sessionId,
            includeDocuments: includeDocuments,
            documentIds: documentIds
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[RAG Error]:", errorData);
        throw new Error(errorData.error || errorData.message || `AI search failed with status: ${response.status}`);
    }

    return await response.json();
};

// ==========================================
// 3. DOCUMENT AI ACTIONS
// ==========================================

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
        const errorText = await response.text();
        console.error("[POST Summarize Error]:", response.status, errorText);
        throw new Error("Failed to generate document summary.");
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
        const errorText = await response.text();
        console.error(`[POST Generate Flashcards Error for Doc ${docId}]:`, response.status, errorText);
        throw new Error("Failed to generate flashcards.");
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
        const errorText = await response.text();
        console.error(`[POST Generate Quiz Error for Doc ${docId}]:`, response.status, errorText);
        throw new Error("Failed to generate quiz.");
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
        const errorText = await response.text();
        console.error("[GET Quizzes Error]:", response.status, errorText);
        throw new Error("Failed to fetch quizzes.");
    }

    return await response.json();
};