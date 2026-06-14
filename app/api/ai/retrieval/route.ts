import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { Document } from "@langchain/core/documents";

import { qdrant, QDRANT_COLLECTION_NAME } from "@/lib/qdrant-client";
import { getCurrentUser } from "@/lib/actions/user.actions";

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

        const queryVector = await embeddings.embedQuery(userQuestion);

        const searchResponse = await qdrant.search(QDRANT_COLLECTION_NAME, {
            vector: {
                name: "dense-text",
                vector: queryVector
            },
            filter: {
                must: [
                    {
                        key: "accountId",
                        match: { value: user.accountId }
                    }
                ]
            },
            limit: 10
        });

        const retrievedDocs = searchResponse.map(point => new Document({
            pageContent: point.payload?.text as string || "",
            metadata: {
                fileId: point.payload?.fileId,
                extension: point.payload?.extension,
                chunkId: point.payload?.chunkId
            }
        }));

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
        const answer = await combineDocsChain.invoke({
            input: userQuestion,
            context: retrievedDocs
        });

        return NextResponse.json({ answer });

    } catch (error: any) {
        console.error("[Qdrant Retrieval Error]:", error);
        return NextResponse.json({ error: "Search engine encountered an issue." }, { status: 500 });
    }
}