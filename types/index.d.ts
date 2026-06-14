export interface BaseDocument {
    $id: string;
    $createdAt?: string;
    $updatedAt?: string;
}

export interface User extends BaseDocument {
    email: string;
    accountId: string;
    fullName: string;
    username: string;
    avatar?: string;
    password_hash?: string;
    files?: any;
}

export type FileType = "document" | "image" | "video" | "audio" | "other";

import { Models } from "node-appwrite";

export interface File_ extends Models.Document {
    name: string;
    url: string;
    type: FileType;
    bucketFileId: string;
    accountId: string;
    owner?: string;
    extension: string;
    size: number;
    users: string[];
}

export interface UploadFileProps { file: File; ownerId: string; accountId: string; path: string; }
export interface GetFilesProps { types: FileType[]; searchText?: string; sort?: string; limit?: number; }
export interface RenameFileProps { fileId: string; name: string; extension: string; path: string; }
export interface UpdateFileUsersProps { fileId: string; emails: string[]; path: string; }
export interface DeleteFileProps { fileId: string; bucketFileId: string; path: string; }
export interface UpdateEditedFileProps { fileId: string; oldBucketFileId: string; file: File; path: string; }

export interface IFileStorage {
    uploadFile(props: UploadFileProps): Promise<File_ | undefined>;
    getFiles(props: GetFilesProps): Promise<any>;
    renameFile(props: RenameFileProps): Promise<File_ | undefined>;
    updateFileUsers(props: UpdateFileUsersProps): Promise<File_ | undefined>;
    updateEditedFile(props: UpdateEditedFileProps): Promise<File_ | undefined>;
    deleteFile(props: DeleteFileProps): Promise<{ status: string } | undefined>;
    getTotalSpaceUsed(): Promise<any>;
    getFileBuffer(bucketFileId: string): Promise<Buffer>;
}

export interface CreateAccountProps { fullName: string; username: string; email: string; password?: string; }
export interface SignInProps { email: string; password?: string; }

export interface IAuthService {
    getUserById(id: string | undefined): Promise<User | null>;
    getUserFullName(id: string | undefined): Promise<string | null>;
    getUserByEmail(email: string): Promise<User | null>;
    createAccount(props: CreateAccountProps): Promise<{ accountId: string | null }>;
    signInUser(props: SignInProps): Promise<{ accountId: string | null }>;
    getCurrentUser(): Promise<User | null>;
    signOutUser(): Promise<void>;
}

export interface ProcessFileAIProps { file: File; endpoint: string; extraParams?: Record<string, string>; }
export interface DeepResearchProps { files: File[]; topic: string; }

export interface IAIService {
    executeAIFeature(props: ProcessFileAIProps): Promise<any>;
    executeDeepResearch(props: DeepResearchProps): Promise<any>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}