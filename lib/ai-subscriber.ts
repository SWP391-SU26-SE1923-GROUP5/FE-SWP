import eventBus, { EVENTS } from './event-bus';
import { pinecone, PINECONE_INDEX_NAME } from './pinecone-client';

eventBus.on(EVENTS.FILE_CREATED, async ({ fileId, accountId, bucketFileId, mimeType }) => {
    console.log(`[AI Sync] Indexing file: ${fileId} into namespace: ${accountId}`);

    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is missing from environment variables.");

        const response = await fetch(`${baseUrl}/api/ai/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, accountId, bucketFileId, mimeType })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown server error" }));
            throw new Error(`Server returned ${response.status}: ${errorData.error}`);
        }

        console.log(`[AI Sync] Successfully indexed file: ${fileId}`);
    } catch (error) {
        console.error(`[AI Sync] Ingestion trigger failed for ${fileId}:`, error);
    }
});

eventBus.on(EVENTS.FILE_DELETED, async ({ fileId, accountId }) => {
    console.log(`[AI Sync] Purging vectors for file: ${fileId} from namespace: ${accountId}`);
    try {
        const index = pinecone.index(PINECONE_INDEX_NAME);
        await index.namespace(accountId).deleteMany({
            filter: { fileId: fileId }
        });
        console.log(`[AI Sync] Successfully purged vectors for: ${fileId}`);
    } catch (error) {
        console.error(`[AI Sync] Purge failed for ${fileId}:`, error);
    }
});

eventBus.on(EVENTS.FILE_RENAMED, async ({ fileId, accountId, newName }) => {
    console.log(`[AI Sync] Notified of rename for file: ${fileId} to ${newName}`);
});