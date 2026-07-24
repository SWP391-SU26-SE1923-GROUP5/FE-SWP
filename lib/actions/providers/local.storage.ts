import {
    IFileStorage,
    DeleteFileProps,
    GetFilesProps,
    RenameFileProps,
    UpdateFileUsersProps,
    UploadFileProps,
    UpdateEditedFileProps,
    File_,
    FileType,
    Subject,
    DocumentShareDto
} from "@/types";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { parseStringify } from "@/lib/utils";
import { redirect } from "next/navigation";

const url = process.env.NEXT_PUBLIC_API_URL;
if (!url) {
    throw new Error("CRITICAL: NEXT_PUBLIC_API_URL environment variable is missing.");
}
const connection_url = url;

const getFileCategory = (mimeType: string): FileType => {
    if (!mimeType) return "other";

    const lowerMime = mimeType.toLowerCase();

    if (lowerMime.startsWith("image/")) return "image";
    if (lowerMime.startsWith("video/")) return "video";
    if (lowerMime.startsWith("audio/")) return "audio";

    const documentMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "text/markdown",
        "text/html",
        "application/json"
    ];

    if (documentMimeTypes.includes(lowerMime)) return "document";

    return "other";
};

export class LocalStorage implements IFileStorage {
    private async getHeaders(isFormData = false) {
        const session = await auth();

        if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
            redirect("/sign-in");
        }

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${session.accessToken}`
        };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    private handleError(error: unknown, context: string): never {
        const err = error as Record<string, unknown>;
        if (err && typeof err === 'object' && typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }

        console.error(`${context} Error:`, error);
        throw error;
    }

    async getSubjects(): Promise<Subject[]> {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Subject?Limit=100`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Failed to fetch subjects"}`);
            }

            const responseData = await res.json();
            return parseStringify(responseData?.items || []);

        } catch (error) {
            this.handleError(error, "GetSubjects");
        }
    }

    async uploadFile({ file, path, subjectId }: UploadFileProps) {
        try {
            const currentSpace = await this.getTotalSpaceUsed();

            if (currentSpace) {
                const projectedSpace = currentSpace.used + file.size;

                if (projectedSpace > currentSpace.all) {
                    console.error(`[UPLOAD BLOCKED] Projected: ${projectedSpace} Bytes | Limit: ${currentSpace.all} Bytes`);
                    throw new Error("Storage limit exceeded. Please delete some files or upgrade your plan to upload this file.");
                }
            }

            const headers = await this.getHeaders(true);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('subjectId', subjectId);

            const res = await fetch(`${connection_url}/api/Document/upload/file`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || errorData?.title || "Upload failed"}`);
            }

            const uploadResponse = await res.json();

            if (path) {
                revalidatePath(path);
            }

            return parseStringify(uploadResponse);
        } catch (error) {
            this.handleError(error, "UploadFile");
        }
    }

    async getFileStatus(fileId: string) {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document/${fileId}/status`, {
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Failed to get file status"}`);
            }

            return await res.json();
        } catch (error) {
            this.handleError(error, "GetFileStatus");
        }
    }

    async reprocessFile(fileId: string) {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document/${fileId}/reprocess`, {
                method: 'POST',
                headers
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Cannot reprocess this document."}`);
            }
            return await res.json();
        } catch (error) {
            this.handleError(error, "ReprocessFile");
        }
    }

    async getFiles({ types = [], searchText = "", sort = "CreatedAt-desc", limit = 10, page = 1, subjectId }: GetFilesProps) {
        try {
            const headers = await this.getHeaders();
            const [sortBy, orderBy] = sort.split('-');
            const isDescending = orderBy === 'desc';
            const fetchLimit = types.length > 0 ? 100 : limit;
            const fetchOffset = types.length > 0 ? 0 : (page - 1) * limit;

            const queryParams = new URLSearchParams({
                Offset: fetchOffset.toString(),
                Limit: fetchLimit.toString(),
                SortBy: sortBy,
                IsDescending: isDescending.toString()
            });

            if (searchText) {
                queryParams.append("SearchTerm", searchText);
            }

            if (subjectId) {
                queryParams.append("SubjectId", subjectId);
            }

            const res = await fetch(`${connection_url}/api/Document?${queryParams.toString()}`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Failed to fetch documents"}`);
            }

            const responseData = await res.json();

            let documents: File_[] = responseData?.items || [];
            let total = responseData?.totalCount || 0;

            if (types.length > 0) {
                documents = documents.filter((file) => {
                    const fileCategory = getFileCategory(file.fileType);
                    return types.includes(fileCategory as FileType);
                });

                total = documents.length;
                const offset = (page - 1) * limit;
                documents = documents.slice(offset, offset + limit);
            }

            return parseStringify({ documents, total });

        } catch (error) {
            this.handleError(error, "GetFiles");
        }
    }

    async renameFile({ fileId, name, extension, path }: RenameFileProps) {
        try {
            const headers = await this.getHeaders();
            const newFileName = `${name}.${extension}`;

            const getRes = await fetch(`${connection_url}/api/Document/${fileId}`, {
                method: 'GET',
                headers,
            });

            if (!getRes.ok) {
                const errorData = await getRes.json().catch(() => ({}));
                throw new Error(`[${getRes.status}] ${errorData?.message || "Failed to fetch file for renaming"}`);
            }

            const currentFile = await getRes.json();

            const payload = {
                title: newFileName,
                fileName: newFileName,
                fileExtension: extension,
                fileType: currentFile.fileType,
                shareStatus: currentFile.shareStatus
            };

            const putRes = await fetch(`${connection_url}/api/Document/${fileId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });

            if (!putRes.ok) {
                const errorData = await putRes.json().catch(() => ({}));
                throw new Error(`[${putRes.status}] ${errorData?.message || "Rename failed"}`);
            }

            const data = await putRes.json();
            revalidatePath(path);

            return parseStringify(data);

        } catch (error) {
            this.handleError(error, "RenameFile");
        }
    }

    async updateFileUsers({ fileId, emails, path, levels }: UpdateFileUsersProps) {
        try {
            const headers = await this.getHeaders();
            const targetUserIds = (emails || []).filter(id => id && id.trim() !== "");

            try {
                const getRes = await fetch(`${connection_url}/api/Document/${fileId}/shares`, {
                    method: 'GET',
                    headers,
                });
                if (getRes.ok) {
                    const getData = await getRes.json().catch(() => null);
                    const currentShares = getData?.shares || (Array.isArray(getData) ? getData : []);
                    for (const share of currentShares) {
                        const existingUserId = share.userId;
                        if (existingUserId && !targetUserIds.includes(existingUserId)) {
                            await fetch(`${connection_url}/api/Document/${fileId}/shares/${existingUserId}`, {
                                method: 'DELETE',
                                headers,
                            }).catch(() => null);
                        }
                    }
                }
            } catch (diffError) {
                console.warn("[updateFileUsers] Warning during diff revoke:", diffError);
            }

            if (targetUserIds.length === 0) {
                if (path) revalidatePath(path);
                return parseStringify({ documentId: fileId, sharedUserIds: [], levels: [] });
            }

            const payload = {
                sharedUserIds: targetUserIds,
                levels: levels || [],
            };

            const shareRes = await fetch(`${connection_url}/api/Document/${fileId}/share`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!shareRes.ok) {
                const errorData = await shareRes.json().catch(() => ({}));
                throw new Error(`[${shareRes.status}] ${errorData?.message || "Update users failed"}`);
            }

            const data = await shareRes.json();

            if (path) {
                revalidatePath(path);
            }

            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "UpdateFileUsers");
        }
    }

    async getDocumentShares(fileId: string): Promise<DocumentShareDto[]> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document/${fileId}/shares`, {
                method: 'GET',
                headers,
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Failed to get document shares"}`);
            }
            const data = await res.json();
            return parseStringify(data?.shares || (Array.isArray(data) ? data : []));
        } catch (error) {
            this.handleError(error, "GetDocumentShares");
        }
    }

    async revokeDocumentShare(fileId: string, targetUserId: string, path?: string): Promise<boolean> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document/${fileId}/shares/${targetUserId}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Failed to revoke share"}`);
            }
            if (path) {
                revalidatePath(path);
            }
            return true;
        } catch (error) {
            this.handleError(error, "RevokeDocumentShare");
        }
    }

    async updateEditedFile({ fileId, file, path }: UpdateEditedFileProps) {
        try {
            const headers = await this.getHeaders();
            let subjectId = "";

            const getRes = await fetch(`${connection_url}/api/Document/${fileId}`, {
                method: 'GET',
                headers,
            });

            if (!getRes.ok) {
                const errorData = await getRes.json().catch(() => ({}));
                throw new Error(`[${getRes.status}] ${errorData?.message || "Failed to fetch existing file for editing"}`);
            }

            const currentFile = await getRes.json();
            subjectId = currentFile?.subjectId || "";

            await this.deleteFile({ fileId, path });

            const newFileResponse = await this.uploadFile({
                file,
                path,
                subjectId
            });

            return parseStringify(newFileResponse);
        } catch (error) {
            this.handleError(error, "UpdateEditedFile");
        }
    }

    async deleteFile({ fileId, path }: DeleteFileProps) {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Document/${fileId}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Delete failed"}`);
            }

            revalidatePath(path);
            return parseStringify({ status: "success" });
        } catch (error) {
            this.handleError(error, "DeleteFile");
        }
    }

    async downloadFile({ fileId }: { fileId: string }) {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Document/${fileId}/download`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Download failed"}`);
            }

            const contentType = res.headers.get("content-type") || "application/octet-stream";
            const arrayBuffer = await res.arrayBuffer();

            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');

            return parseStringify({ data: base64Data, contentType });

        } catch (error) {
            this.handleError(error, "DownloadFile");
        }
    }

    async previewFile({ fileId }: { fileId: string }) {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Document/${fileId}/preview`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Preview failed"}`);
            }

            const contentType = res.headers.get("content-type") || "application/octet-stream";
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');

            return parseStringify({ data: base64Data, contentType });
        } catch (error) {
            this.handleError(error, "PreviewFile");
        }
    }

    async getTotalSpaceUsed() {
        try {
            const headers = await this.getHeaders();
            const session = await auth();

            const res = await fetch(`${connection_url}/api/Document`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Failed to fetch documents for space calculation"}`);
            }

            const responseData = await res.json();
            const documents: File_[] = responseData?.items || [];

            const user = session?.user as Record<string, unknown> | undefined;

            let userCapacityBytes = 3 * 1024 * 1024 * 1024;

            if (user?.tierStorageLimitMb && Number(user.tierStorageLimitMb) > 0) {
                userCapacityBytes = Number(user.tierStorageLimitMb) * 1024 * 1024;
            }

            const totalSpace = {
                image: { size: 0, latestDate: "" },
                document: { size: 0, latestDate: "" },
                video: { size: 0, latestDate: "" },
                audio: { size: 0, latestDate: "" },
                other: { size: 0, latestDate: "" },
                used: 0,
                all: userCapacityBytes
            };

            documents.forEach((file) => {
                const type = getFileCategory(file.fileType) as FileType;

                if (totalSpace[type]) {
                    const fileSize = file.fileSizeBytes || 0;

                    totalSpace[type].size += fileSize;
                    totalSpace.used += fileSize;

                    const fileDate = new Date(file.createdAt || "").getTime();
                    const latestDate = totalSpace[type].latestDate
                        ? new Date(totalSpace[type].latestDate).getTime()
                        : 0;

                    if (fileDate > latestDate) {
                        totalSpace[type].latestDate = file.createdAt || "";
                    }
                }
            });

            return parseStringify(totalSpace);

        } catch (error) {
            this.handleError(error, "GetTotalSpaceUsed");
        }
    }

    async getTrashFiles() {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document/trashed`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404) return parseStringify({ documents: [] });
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Failed to fetch trash files"}`);
            }

            const responseData = await res.json();
            const documents = responseData?.items || (Array.isArray(responseData) ? responseData : []);
            return parseStringify({ documents: Array.isArray(documents) ? documents : [] });
        } catch (error) {
            this.handleError(error, "GetTrashFiles");
        }
    }

    async restoreFile({ fileId, path }: { fileId: string; path?: string }) {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document/${fileId}/restore`, {
                method: 'POST',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Restore failed"}`);
            }

            if (path) revalidatePath(path);
            return parseStringify({ status: "success" });
        } catch (error) {
            this.handleError(error, "RestoreFile");
        }
    }

    async permanentDeleteFile({ fileId, path }: { fileId: string; path?: string }) {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document/${fileId}/purge`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData?.message || "Permanent delete failed"}`);
            }

            if (path) revalidatePath(path);
            return parseStringify({ status: "success" });
        } catch (error) {
            this.handleError(error, "PermanentDeleteFile");
        }
    }
}