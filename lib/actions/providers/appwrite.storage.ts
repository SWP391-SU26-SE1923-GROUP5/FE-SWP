import { IFileStorage } from "@/types";
import { createAdminClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/user.actions";
import eventBus, { EVENTS } from "@/lib/event-bus";
import {
    DeleteFileProps, GetFilesProps, RenameFileProps,
    UpdateFileUsersProps, UploadFileProps, User,
    FileType, File_, UpdateEditedFileProps
} from "@/types";

const handleError = (error: unknown, message: string) => {
    console.error(error, message);
    throw error;
};

const createQueries = (currentUser: User, types: string[], searchText: string, sort: string, limit?: number) => {
    const queries = [
        Query.or([
            Query.equal("owner", [currentUser.$id]),
            Query.contains("users", [currentUser.email]),
        ])
    ];
    if (types.length > 0) queries.push(Query.equal("type", types));
    if (searchText) queries.push(Query.contains("name", searchText));
    if (limit) queries.push(Query.limit(limit));

    const [sortBy, orderBy] = sort.split('-');
    queries.push(orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy));
    return queries;
};

export class AppwriteStorage implements IFileStorage {
    async uploadFile({ file, ownerId, accountId, path }: UploadFileProps) {
        const { storage, databases } = await createAdminClient();
        try {
            const inputFile = InputFile.fromBuffer(file, file.name);
            const bucketFile = await storage.createFile(appwriteConfig.bucketId, ID.unique(), inputFile);

            const fileDocument = {
                type: getFileType(bucketFile.name).type,
                name: bucketFile.name,
                url: constructFileUrl(bucketFile.$id),
                extension: getFileType(bucketFile.name).extension,
                size: bucketFile.sizeOriginal,
                owner: ownerId,
                accountId,
                users: [],
                bucketFileId: bucketFile.$id
            };

            const newFile = await databases.createDocument(
                appwriteConfig.databaseId, appwriteConfig.filesCollectionId, ID.unique(), fileDocument
            ).catch(async (error) => {
                await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
                handleError(error, "Failed to create file document");
            });

            eventBus.emit(EVENTS.FILE_CREATED, {
                fileId: newFile?.$id, accountId, bucketFileId: bucketFile.$id, mimeType: file.type
            });

            revalidatePath(path);
            return parseStringify(newFile);
        } catch (error) { handleError(error, "Failed to upload file"); }
    }

    async getFiles({ types = [], searchText = "", sort = "$createdAt-desc", limit }: GetFilesProps) {
        const { databases } = await createAdminClient();
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("Current user does not exist");

            const queries = createQueries(currentUser, types as string[], searchText, sort, limit);
            const files = await databases.listDocuments(
                appwriteConfig.databaseId, appwriteConfig.filesCollectionId, queries
            );
            return parseStringify(files);
        } catch (error) { handleError(error, "Failed to get files"); }
    }

    async renameFile({ fileId, name, extension, path }: RenameFileProps) {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User not authenticated");

            const newName = `${name}.${extension}`;
            const { databases } = await createAdminClient();
            const updatedFile = await databases.updateDocument(
                appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId, { name: newName }
            );

            eventBus.emit(EVENTS.FILE_RENAMED, { fileId, accountId: currentUser.accountId, newName });
            revalidatePath(path);
            return parseStringify(updatedFile);
        } catch (error) { handleError(error, "Failed to rename the file."); }
    }

    async updateFileUsers({ fileId, emails, path }: UpdateFileUsersProps) {
        try {
            const { databases } = await createAdminClient();
            const updatedFile = await databases.updateDocument(
                appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId, { users: emails }
            );
            revalidatePath(path);
            return parseStringify(updatedFile);
        } catch (error) { handleError(error, "Failed to update the file users."); }
    }

    async updateEditedFile({ fileId, oldBucketFileId, file, path }: UpdateEditedFileProps) {
        try {
            const { storage, databases } = await createAdminClient();
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User not authenticated");

            const arrayBuffer = await file.arrayBuffer();
            const inputFile = InputFile.fromBuffer(Buffer.from(arrayBuffer), file.name);
            const newBucketFile = await storage.createFile(appwriteConfig.bucketId, ID.unique(), inputFile);
            const newUrl = constructFileUrl(newBucketFile.$id);

            const updatedDocument = await databases.updateDocument(
                appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId,
                { bucketFileId: newBucketFile.$id, url: newUrl, size: newBucketFile.sizeOriginal, extension: getFileType(newBucketFile.name).extension }
            );

            await storage.deleteFile(appwriteConfig.bucketId, oldBucketFileId);
            eventBus.emit(EVENTS.FILE_DELETED, { fileId, accountId: currentUser.accountId });
            eventBus.emit(EVENTS.FILE_CREATED, { fileId, accountId: currentUser.accountId, fileUrl: newUrl, mimeType: file.type });

            revalidatePath(path);
            return parseStringify(updatedDocument);
        } catch (error) { handleError(error, "Failed to update edited file"); }
    }

    async deleteFile({ fileId, bucketFileId, path }: DeleteFileProps) {
        try {
            const { databases, storage } = await createAdminClient();
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User not authenticated");

            const deletedFile = await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.filesCollectionId, fileId);
            if (deletedFile) await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);

            eventBus.emit(EVENTS.FILE_DELETED, { fileId, accountId: currentUser.accountId });
            revalidatePath(path);
            return parseStringify({ status: "success" });
        } catch (error) { handleError(error, "Failed to delete the file."); }
    }

    async getTotalSpaceUsed() {
        try {
            const { databases } = await createAdminClient();
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User is not authenticated.");

            const files = await databases.listDocuments(
                appwriteConfig.databaseId, appwriteConfig.filesCollectionId, [Query.equal("owner", [currentUser.$id])]
            );

            const totalSpace = {
                image: { size: 0, latestDate: "" },
                document: { size: 0, latestDate: "" },
                video: { size: 0, latestDate: "" },
                audio: { size: 0, latestDate: "" },
                other: { size: 0, latestDate: "" },
                used: 0,
                all: 2 * 1024 * 1024 * 1024
            };

            files.documents.forEach((file) => {
                const fileType = file.type as FileType;
                totalSpace[fileType].size += file.size;
                totalSpace.used += file.size;
                if (!totalSpace[fileType].latestDate || new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)) {
                    totalSpace[fileType].latestDate = file.$updatedAt;
                }
            });
            return parseStringify(totalSpace);
        } catch (error) { handleError(error, "Error calculating total space used: "); }
    }

    async getFileBuffer(bucketFileId: string): Promise<Buffer> {
        try {
            const { storage } = await createAdminClient();
            const arrayBuffer = await storage.getFileDownload(appwriteConfig.bucketId, bucketFileId);
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error("[Appwrite Storage] Get File Buffer Error:", error);
            throw error;
        }
    }
}