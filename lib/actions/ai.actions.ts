import { File_ } from "@/types";

const downloadAppwriteFile = async (appwriteFile: File_): Promise<File> => {
    const fileResponse = await fetch(appwriteFile.url);

    if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${appwriteFile.name}`);
    }

    const blob = await fileResponse.blob();
    let mimeType = blob.type;

    if (!mimeType || mimeType === "application/octet-stream" || mimeType === "") {
        const ext = appwriteFile.extension?.toLowerCase() || '';
        const types: Record<string, string> = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'mp4': 'video/mp4',
            'webm': 'audio/webm',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'json': 'application/json',
            'jpg': 'image/jpeg',
            'png': 'image/png'
        };
        mimeType = types[ext] || 'application/octet-stream';
    }

    return new File([blob], appwriteFile.name, { type: mimeType });
};

export const executeAIFeature = async (appwriteFile: File_, endpoint: string, extraParams?: Record<string, string>) => {
    const nativeFile = await downloadAppwriteFile(appwriteFile);
    const formData = new FormData();

    const fileKey = endpoint === 'video-indexer' ? 'video' : 'file';
    formData.append(fileKey, nativeFile);

    if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => formData.append(k, v));
    }

    const response = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI processing failed with status: ${response.status}`);
    }

    return await response.json();
};

export const executeDeepResearch = async (files: File_[], topic: string) => {
    const formData = new FormData();
    formData.append('topic', topic);

    for (const appwriteFile of files) {
        const nativeFile = await downloadAppwriteFile(appwriteFile);
        formData.append('files', nativeFile);
    }

    const response = await fetch('/api/ai/deep-research', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error("Deep Research batch execution failed.");
    }

    return await response.json();
};

export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    const response = await fetch('/api/ai/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ texts })
    });

    if (!response.ok) {
        throw new Error("Embedding generation failed.");
    }

    const data = await response.json();
    return data.embeddings || data;
};