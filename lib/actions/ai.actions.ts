"use server";

import { auth } from "@/auth";
import {
    SummaryResponse,
    Flashcard,
    QuizResponse,
    QuizRecord,
    QuizSubmissionResponse,
    ReviewFlashcardResult,
    DueFlashcard,
    FlashcardReviewStats
} from "@/types";
import { revalidatePath } from "next/cache";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export interface ChatMessage {
    id: string;
    chatSessionId: string;
    sender: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatSession {
    id: string;
    userId: string;
    documentId: string | null;
    sessionTitle: string;
    createdAt: string;
    updatedAt: string;
}

export interface Citation {
    source: string;
    content: string;
    relevance: number;
}

export interface RAGCitation {
    index: number;
    documentTitle: string;
    chunkPreview: string;
}

export interface RAGReference {
    index: number;
    documentId: string;
    documentTitle: string;
    pageInfo: string;
    chunkExcerpt: string;
}

export interface RAGResponse {
    answer: string;
    citations?: RAGCitation[];
    references?: RAGReference[];
    neighbors?: any[];
}

export interface SemanticSearchResponse {
    answer: string;
    citations: Citation[];
    confidence: number;
}

export const createChatSession = async (
    sessionTitle: string = "New Chat Session",
    documentId?: string | null
): Promise<ChatSession> => {
    const session = await auth();
    if (!session?.accessToken) {
        throw new Error("Unauthorized. Please log in.");
    }

    const payload: Record<string, unknown> = { sessionTitle };
    if (documentId) payload.documentId = documentId;

    const response = await fetch(`${connection_url}/api/Chat/sessions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to create chat session."}`);
    }

    const data = await response.json();
    if (documentId && !data.documentId) {
        data.documentId = documentId;
    }
    return data;
};

export const sendChatMessage = async (
    sessionId: string,
    documentId: string,
    message: string
): Promise<ChatMessage> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Chat/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sessionId: sessionId,
            documentId: documentId,
            message: message
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || "Failed to send message."}`);
    }

    return await response.json();
};

export const deleteFlashcard = async (flashcardId: string): Promise<void> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Flashcard/${flashcardId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || "Failed to delete flashcard."}`);
    }

    revalidatePath("/flashcards");
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

export const generateFlashcards = async (docId: string, numberOfFlashcards: number = 5): Promise<Flashcard[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const safeAmount = Math.min(Math.max(1, numberOfFlashcards), 20);

    const response = await fetch(`${connection_url}/api/AI/flashcards/generate?docId=${docId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            numberOfFlashcards: safeAmount
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

    const safeAmount = Math.min(Math.max(1, numberOfQuestions), 20);

    const response = await fetch(`${connection_url}/api/AI/quizzes/generate?docId=${docId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            numberOfQuestions: safeAmount
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to generate quiz."}`);
    }

    return await response.json();
};

export const getCreatedFlashcards = async (): Promise<Flashcard[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Flashcard?limit=100`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch flashcards."}`);
    }

    const data = await response.json();
    return data?.items || [];
};

export const getFlashcardsByDocument = async (docId: string): Promise<Flashcard[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Flashcard/${docId}/flashcards`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch flashcards."}`);
    }

    return await response.json();
};

export const submitFlashcardReview = async (
    flashcardId: string,
    quality: number,
    timeSpentSeconds?: number
): Promise<ReviewFlashcardResult> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/FlashcardReview/review`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            flashcardId,
            quality,
            timeSpentSeconds: timeSpentSeconds || 5,
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to submit flashcard review."}`);
    }

    return await response.json();
};

export const getDueFlashcards = async (limit: number = 50): Promise<DueFlashcard[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/FlashcardReview/due?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch due flashcards."}`);
    }

    return await response.json();
};

export const getDueFlashcardsCount = async (): Promise<number> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/FlashcardReview/due/count`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        return 0;
    }

    return await response.json();
};

export const getFlashcardReviewStats = async (userId?: string): Promise<FlashcardReviewStats> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");
    const targetId = userId || session.user?.id || "00000000-0000-0000-0000-000000000000";

    const response = await fetch(`${connection_url}/api/FlashcardReview/stats/${targetId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch flashcard stats."}`);
    }

    return await response.json();
};

export const getCreatedQuizzes = async (params?: {
    offset?: number;
    limit?: number;
    searchTerm?: string;
    sortBy?: string;
    isDescending?: boolean;
}): Promise<QuizRecord[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const searchParams = new URLSearchParams();
    searchParams.set("limit", (params?.limit ?? 100).toString());
    if (params?.offset !== undefined) searchParams.set("offset", params.offset.toString());
    if (params?.searchTerm) searchParams.set("searchTerm", params.searchTerm);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.isDescending !== undefined) searchParams.set("isDescending", params.isDescending.toString());

    const response = await fetch(`${connection_url}/api/Quiz?${searchParams.toString()}`, {
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

export const getFlashcardById = async (flashcardId: string): Promise<Flashcard> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Flashcard/${flashcardId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || "Failed to fetch flashcard."}`);
    }

    return await response.json();
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
            id: q.id || q.Id,
            questionTitle: q.title,
            answers: q.answers || []
        })) || []
    };
};

export const submitQuiz = async (
    quizId: string,
    answers: Record<string, string>,
    durationSeconds?: number
): Promise<any> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: session.user?.id || "00000000-0000-0000-0000-000000000000",
            quizId: quizId,
            answers: JSON.stringify(answers),
            durationSeconds: durationSeconds || 60
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || "Failed to submit quiz."}`);
    }

    return await response.json();
};

export const getQuizHistory = async (quizId: string): Promise<QuizSubmissionResponse[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Quiz/${quizId}/history`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        return [];
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

    const data = await response.json();
    const arr = Array.isArray(data) ? data : (data?.messages || data?.data || data?.items || []);
    return arr.map((msg: any) => {
        const rawSender = (msg.sender || msg.Sender || msg.role || msg.Role || "").toString().toLowerCase();
        const isUser = rawSender === "user" || msg.isUser === true || (rawSender !== "" && rawSender !== "ai" && rawSender !== "assistant" && rawSender !== "system" && rawSender !== "bot");
        return {
            ...msg,
            sender: isUser ? "user" : "ai",
            content: msg.content || msg.Content || msg.text || msg.Text || ""
        };
    });
};

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

export const semanticSearch = async (
    question: string
): Promise<SemanticSearchResponse> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/AI/rag/ask`, {
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

export const summarizeRagDocument = async (documentId: string): Promise<SummaryResponse> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/AI/rag/summarize`, {
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
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to generate RAG summary."}`);
    }

    return await response.json();
};

export interface ChatSessionDocument {
    id?: string;
    chatSessionId: string;
    documentId: string;
    title: string;
    fileName: string;
    addedAt: string;
}

export const getSessionDocuments = async (sessionId: string): Promise<ChatSessionDocument[]> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Chat/sessions/${sessionId}/documents`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to fetch session documents."}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data?.items || []);
};

export const addDocumentToSession = async (sessionId: string, documentId: string): Promise<ChatSessionDocument> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Chat/sessions/${sessionId}/documents?documentId=${documentId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to add document to session."}`);
    }

    return await response.json();
};

export const removeDocumentFromSession = async (sessionId: string, documentId: string): Promise<void> => {
    const session = await auth();
    if (!session?.accessToken) throw new Error("Unauthorized. Please log in.");

    const response = await fetch(`${connection_url}/api/Chat/sessions/${sessionId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[${response.status}] ${errorData.message || errorData.title || "Failed to remove document from session."}`);
    }
};