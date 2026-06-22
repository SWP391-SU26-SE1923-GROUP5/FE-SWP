import {
    IFileStorage,
    DeleteFileProps,
    GetFilesProps,
    RenameFileProps,
    UpdateFileUsersProps,
    UploadFileProps,
    UpdateEditedFileProps,
    File_, FileType
} from "@/types";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { parseStringify } from "@/lib/utils";
import {redirect} from "next/navigation";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

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
        if (!session?.accessToken) {
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

    async uploadFile({ file, path }: UploadFileProps) {
        try {
            const headers = await this.getHeaders(true);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('subjectId', "fbe99f57-8958-4cca-c348-08decc198121");

            const res = await fetch(`${connection_url}/api/DocumentUpload/upload/file`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(`Upload failed: ${errorData?.message || errorData?.title || res.statusText}`);
            }

            const uploadResponse = await res.json();

            if (path) {
                revalidatePath(path);
            }

            return parseStringify(uploadResponse);
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    }

    async getFiles({ types = [], searchText = "", sort = "CreatedAt-desc", limit = 10, page = 1 }: GetFilesProps & { page?: number }) {
        try {
            const headers = await this.getHeaders();
            const [sortBy, orderBy] = sort.split('-');
            const isDescending = orderBy === 'desc';
            const offset = (page - 1) * limit;

            const queryParams = new URLSearchParams({
                Offset: offset.toString(),
                Limit: limit.toString(),
                SortBy: sortBy,
                IsDescending: isDescending.toString()
            });

            if (searchText) {
                queryParams.append("SearchTerm", searchText);
            }

            const res = await fetch(`${connection_url}/api/Document?${queryParams.toString()}`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);

            const responseData = await res.json();

            let documents: File_[] = responseData?.items || responseData?.Items || [];
            let total = responseData?.totalCount || responseData?.TotalCount || 0;

            if (types.length > 0) {
                documents = documents.filter((file) => {
                    const fileCategory = getFileCategory(file.fileType);
                    return types.includes(fileCategory as FileType);
                });

                total = documents.length;
            }

            return parseStringify({ documents, total });

        } catch (error) {
            console.error("Files Processing Error:", error);
            throw error;
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

            if (!getRes.ok) throw new Error("Failed to fetch file for renaming");
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
                const errorText = await putRes.text();
                throw new Error(`Rename failed (${putRes.status}): ${errorText}`);
            }

            const data = await putRes.json();
            revalidatePath(path);

            return parseStringify(data);

        } catch (error) {
            console.error("Rename Error:", error);
            throw error;
        }
    }

    async updateFileUsers({ fileId, emails, path }: UpdateFileUsersProps) {
        try {
            const headers = await this.getHeaders();

            const payload = {
                sharedUserIds: emails || [],
            };

            const shareRes = await fetch(`${connection_url}/api/Document/${fileId}/share`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!shareRes.ok) {
                const errorText = await shareRes.text().catch(() => "Unknown error");
                throw new Error(`Update users failed: ${shareRes.status} - ${errorText}`);
            }

            const data = await shareRes.json();

            if (path) {
                revalidatePath(path);
            }

            return parseStringify(data);

        } catch (error) {
            console.error("Update Users Error:", error);
            throw error;
        }
    }

    async updateEditedFile({ fileId, file, path }: UpdateEditedFileProps) {
        try {
            await this.deleteFile({ fileId, path });

            const newFileResponse = await this.uploadFile({
                file,
                path
            });

            return parseStringify(newFileResponse);
        } catch (error) {
            console.error("Update Error:", error);
            throw error;
        }
    }

    async deleteFile({ fileId, path }: DeleteFileProps) {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Document/${fileId}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);

            revalidatePath(path);
            return parseStringify({ status: "success" });
        } catch (error) {
            console.error("Delete Error:", error);
            throw error;
        }
    }

    async downloadFile({ fileId }: { fileId: string }) {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Document/${fileId}/download`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

            const arrayBuffer = await res.arrayBuffer();

            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');

            return parseStringify({ data: base64Data });

        } catch (error) {
            console.error("[Local Storage] Download Error:", error);
            throw error;
        }
    }

    async getTotalSpaceUsed() {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Document`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) throw new Error(`Failed to fetch documents for space calculation: ${res.statusText}`);

            const responseData = await res.json();

            const documents: File_[] = Array.isArray(responseData)
                ? responseData
                : (responseData?.items || responseData?.Items || []);

            const totalSpace = {
                image: { size: 0, latestDate: "" },
                document: { size: 0, latestDate: "" },
                video: { size: 0, latestDate: "" },
                audio: { size: 0, latestDate: "" },
                other: { size: 0, latestDate: "" },
                used: 0,
                all: 2 * 1024 * 1024 * 1024
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
            console.error("Space Calculation Error:", error);
            throw error;
        }
    }
}