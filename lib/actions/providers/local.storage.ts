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

    async getFiles({ types = [], searchText = "", sort = "$createdAt-desc", limit }: GetFilesProps) {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Document`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) throw new Error(`Failed to fetch documents: ${res.statusText}`);

            let documents: File_[] = await res.json();

            if (types && types.length > 0) {
                documents = documents.filter(doc => {
                    const category = getFileCategory(doc.fileType);
                    return types.includes(category);
                });
            }

            console.log("Step 2:", documents);

            if (searchText) {
                const lowerQuery = searchText.toLowerCase();
                documents = documents.filter(doc =>
                    doc.fileName.toLowerCase().includes(lowerQuery)
                );
            }

            if (sort) {
                const [sortBy, orderBy] = sort.split('-');
                const isDesc = orderBy === 'desc';

                documents.sort((a, b) => {
                    let valA: string | number;
                    let valB: string | number;

                    if (sortBy === '$createdAt' || sortBy === 'createdAt') {
                        valA = new Date(a.createdAt || "").getTime();
                        valB = new Date(b.createdAt || "").getTime();
                    } else if (sortBy === 'name' || sortBy === 'fileName') {
                        valA = a.fileName.toLowerCase();
                        valB = b.fileName.toLowerCase();
                    } else {
                        const key = sortBy as keyof File_;

                        valA = (a[key] ?? "") as string | number;
                        valB = (b[key] ?? "") as string | number;
                    }

                    if (valA < valB) return isDesc ? 1 : -1;
                    if (valA > valB) return isDesc ? -1 : 1;
                    return 0;
                });
            }

            const total = documents.length;

            if (limit && limit > 0) {
                documents = documents.slice(0, limit);
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

            const getRes = await fetch(`${connection_url}/api/Document/${fileId}`, {
                method: 'GET',
                headers,
            });

            if (!getRes.ok) throw new Error("Failed to fetch file for user update");
            const currentFile = await getRes.json();

            const payload = {
                ...currentFile,
                sharedUsers: emails?.join(","),
            };

            const putRes = await fetch(`${connection_url}/api/Document/${fileId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });

            if (!putRes.ok) throw new Error(`Update users failed: ${putRes.statusText}`);

            const data = await putRes.json();
            revalidatePath(path);

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

            const documents: File_[] = await res.json();

            const totalSpace = {
                image: { size: 0, latestDate: "" },
                document: { size: 0, latestDate: "" },
                video: { size: 0, latestDate: "" },
                audio: { size: 0, latestDate: "" },
                other: { size: 0, latestDate: "" },
                used: 0,
                all: 2 * 1024 * 1024 * 1024 // 2GB limit
            };

            documents.forEach((file) => {
                const type = file.fileType as FileType;

                if (totalSpace[type]) {
                    totalSpace[type].size += file.size || 0;
                    totalSpace.used += file.size || 0;

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