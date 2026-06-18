import NextAuth, { type DefaultSession, type DefaultUser } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";

// ==========================================
// 1. NEXT-AUTH MODULE DECLARATIONS
// ==========================================
declare module "next-auth" {
    interface Session {
        accessToken?: string;
        error?: string;
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpiresAt?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        role: string;
        provider?: string;
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpiresAt?: number;
        error?: string;
    }
}

// ==========================================
// 2. COMMON & BASE TYPES
// ==========================================
export type ActionType = {
    value: string;
    label: string;
    icon?: string;
};

export interface BaseDocument {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

// ==========================================
// 3. AUTHENTICATION & USER TYPES
// ==========================================
export interface CreateAccountProps {
    fullName: string;
    username: string;
    email: string;
    password?: string;
}

export interface IAuthService {
    createAccount(props: CreateAccountProps): Promise<{ email: string | null }>;
    signInUser(props: SignInProps): Promise<LoginResponse | null>;
    getCurrentUser(): Promise<User | null>;
    getUserById(id: string): Promise<User>;
    signOutUser(): Promise<void>;
    verifyOtp(props: VerifyOtpProps): Promise<string>;
    resendOtp(props: { email: string }): Promise<string>;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
}

export interface SignInProps {
    email: string;
    password?: string;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    dateOfBirth?: string;
    currentStorageCapacity?: number;
    currentAiTokenUsage?: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface VerifyOtpProps {
    email: string;
    otp: string;
}

// ==========================================
// 4. FILE & STORAGE TYPES
// ==========================================
export type FileType = "document" | "image" | "video" | "audio" | "other";

export interface DeleteFileProps {
    fileId: string;
    path: string;
}

export interface File_ {
    id: string;
    userId: string;
    subjectId: string;
    title: string;
    fileLink: string;
    fileName: string;
    fileExtension: string;
    fileType: string;
    sharedUsers: string;
    shareStatus: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    size?: number;
}

export interface GetFilesProps {
    types?: FileType[];
    searchText?: string;
    sort?: string;
    limit?: number;
}

export interface IFileStorage {
    uploadFile(props: UploadFileProps): Promise<UploadFileResponse | undefined>;
    getFiles(props: GetFilesProps): Promise<{ documents: File_[]; total: number }>;
    renameFile(props: RenameFileProps): Promise<File_ | undefined>;
    updateFileUsers(props: UpdateFileUsersProps): Promise<File_ | undefined>;
    updateEditedFile(props: UpdateEditedFileProps): Promise<UploadFileResponse | undefined>;
    deleteFile(props: DeleteFileProps): Promise<{ status: string } | undefined>;
    getTotalSpaceUsed(): Promise<{
        image: { size: number; latestDate: string };
        document: { size: number; latestDate: string };
        video: { size: number; latestDate: string };
        audio: { size: number; latestDate: string };
        other: { size: number; latestDate: string };
        used: number;
        all: number;
    }>;
    downloadFile(props: DownloadFileProps): Promise<{ data: string }>;
}

export interface RenameFileProps {
    fileId: string;
    name: string;
    extension: string;
    path: string;
}

export interface UpdateEditedFileProps {
    fileId: string;
    file: File;
    path: string;
}

export interface UpdateFileUsersProps {
    fileId: string;
    emails: string[];
    path: string;
}

export interface UploadFileProps {
    file: File;
    path: string;
}

export interface UploadFileResponse {
    documentId: string;
    status: string;
    chunkCount: number;
    message: string;
}

// ==========================================
// 5. AI INTEGRATION TYPES
// ==========================================
export interface AiResultState {
    type: string;
    data?: {
        fileUrl?: string;
        quiz_title?: string;
        questions?: QuizQuestion[];
        deck_title?: string;
        cards?: Flashcard[];
    };
}

export interface DeepResearchProps {
    files: File[];
    topic: string;
}

export interface Flashcard {
    front: string;
    back: string;
}

export interface IAIService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeAIFeature(props: ProcessFileAIProps): Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executeDeepResearch(props: DeepResearchProps): Promise<any>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface ProcessFileAIProps {
    file: File_;
    endpoint: string;
    extraParams?: Record<string, string>;
}

export interface QuizQuestion {
    question_text: string;
    correct_answer: string;
    options: string[];
}

export interface SearchParamProps {
    params: Promise<{ [key: string]: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}