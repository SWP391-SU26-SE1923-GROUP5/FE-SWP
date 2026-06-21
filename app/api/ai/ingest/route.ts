import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { pinecone, PINECONE_INDEX_NAME } from "@/lib/pinecone-client";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { extractText } from "unpdf";
import mammoth from "mammoth";
import * as xlsx from "xlsx";

export async function POST(req: NextRequest) {
    try {
        const { bucketFileId, mimeType, fileId, accountId } = await req.json();

        if (!accountId) return NextResponse.json({ error: "Missing account." }, { status: 401 });
        if (!bucketFileId) return NextResponse.json({ error: "Missing file ID." }, { status: 400 });

        const { storage } = await createAdminClient();
        const fileArrayBuffer = await storage.getFileDownload(appwriteConfig.bucketId, bucketFileId);
        const buffer = Buffer.from(fileArrayBuffer);

        let documentText = "";
        if (mimeType === "application/pdf") {
            const pdfData = await extractText(new Uint8Array(fileArrayBuffer));
            documentText = Array.isArray(pdfData.text) ? pdfData.text.join("\n") : pdfData.text;
        } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            documentText = (await mammoth.extractRawText({ buffer })).value;
        } else if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            const workbook = xlsx.read(buffer, { type: "buffer" });
            documentText = workbook.SheetNames.map(name => xlsx.utils.sheet_to_csv(workbook.Sheets[name])).join("\n");
        } else {
            documentText = buffer.toString('utf-8');
        }

        documentText = documentText.replace(/\0/g, '').trim();
        if (!documentText) throw new Error("No readable text.");

        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const docs = await splitter.createDocuments([documentText]);

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            modelName: "gemini-embedding-001"
        });

        const vectors = await embeddings.embedDocuments(docs.map(d => d.pageContent));

        const records = docs.map((doc, i) => ({
            id: `${fileId}-${i}`,
            values: vectors[i],
            metadata: {
                text: doc.pageContent,
                fileId: fileId,
                extension: mimeType.split('/').pop() || 'file'
            }
        }));

        const index = pinecone.index(PINECONE_INDEX_NAME).namespace(accountId);
        await index.upsert({ records });

        console.log(`Successfully indexed ${records.length} chunks to Pinecone.`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Ingestion Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}