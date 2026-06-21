import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pinecone, PINECONE_INDEX_NAME } from "@/lib/pinecone-client";

import { getCurrentUser } from "@/lib/actions/user.actions";
import {createStuffDocumentsChain} from "@langchain/classic/chains/combine_documents";
import {createRetrievalChain} from "@langchain/classic/chains/retrieval";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.accountId) {
            return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
        }

        const { userQuestion } = await req.json();
        if (!userQuestion) return NextResponse.json({ error: "Missing query" }, { status: 400 });

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: "gemini-embedding-001"
        });

        const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex,
            namespace: user.accountId
        });

        const retriever = vectorStore.asRetriever({
            searchType: "mmr",
            searchKwargs: { fetchK: 10, lambda: 0.5 }
        });

        const llm = new ChatGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
            model: "gemini-3.5-flash",
            temperature: 0
        });

        const prompt = ChatPromptTemplate.fromTemplate(`
            You are the SmartStore Global Discovery Agent. 
            Search across the provided repository chunks to answer the user's question.
            If the answer is not in the chunks, explicitly state: "This information is not found in your Drive."
            
            CONTEXT: {context}
            QUERY: {input}
        `);

        const combineDocsChain = await createStuffDocumentsChain({ llm, prompt });
        const retrievalChain = await createRetrievalChain({ retriever, combineDocsChain });
        const result = await retrievalChain.invoke({ input: userQuestion });

        return NextResponse.json({ answer: result.answer });
    } catch (error: any) {
        console.error("[Namespaced Retrieval Error]:", error);
        return NextResponse.json({ error: "Search engine encountered an issue." }, { status: 500 });
    }
}