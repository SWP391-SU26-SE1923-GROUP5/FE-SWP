import NextAuth, { type DefaultSession, type DefaultUser } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        accessTokenExpiresAt?: number;
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

export interface BaseDocument {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

export type ActionType = {
    value: string;
    label: string;
    icon?: string;
};

export interface SearchParamProps {
    params: Promise<{ [key: string]: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface User extends BaseDocument {
    fullName: string;
    email: string;
    role: string;
    dateOfBirth?: string;
    currentStorageCapacity?: number;
    currentAiTokenUsage?: number;
    status?: string;
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

export interface CreateAccountProps extends SignInProps {
    fullName: string;
    username: string;
}

export interface VerifyOtpProps {
    email: string;
    otp: string;
}

export interface IAuthService {
    createAccount(props: CreateAccountProps): Promise<{ email: string | null }>;
    signInUser(props: SignInProps): Promise<LoginResponse | null>;
    getCurrentUser(): Promise<User | null>;
    getUserById(id: string): Promise<User>;
    signOutUser(): Promise<void>;
    verifyOtp(props: VerifyOtpProps): Promise<string>;
    resendOtp(props: { email: string }): Promise<string>;
    refreshSessionToken(refreshToken: string, accessToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: string;
    }>;
}

export type FileType = "document" | "image" | "video" | "audio" | "other";

export interface File_ extends BaseDocument {
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
    fileSizeBytes: number;
}

export interface Subject extends BaseDocument {
    id: string;
    subjectCode: string;
    subjectName: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetFilesProps {
    types?: FileType[];
    searchText?: string;
    sort?: string;
    limit?: number;
    page?: number;
    subjectId?: string;
}

export interface UploadFileProps {
    file: File;
    path: string;
    subjectId: string;
}

export interface UploadFileResponse {
    documentId: string;
    status: string;
    chunkCount: number;
    message: string;
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

export interface DeleteFileProps {
    fileId: string;
    path: string;
}

export interface DownloadFileProps {
    fileId: string;
    path?: string;
}

export interface StorageCategoryStats {
    size: number;
    latestDate: string;
}

export interface IFileStorage {
    getSubjects(): Promise<Subject[]>;
    uploadFile(props: UploadFileProps): Promise<UploadFileResponse | undefined>;
    getFiles(props: GetFilesProps): Promise<{ documents: File_[]; total: number }>;
    renameFile(props: RenameFileProps): Promise<File_ | undefined>;
    updateFileUsers(props: UpdateFileUsersProps): Promise<File_ | undefined>;
    updateEditedFile(props: UpdateEditedFileProps): Promise<UploadFileResponse | undefined>;
    deleteFile(props: DeleteFileProps): Promise<{ status: string } | undefined>;
    downloadFile(props: DownloadFileProps): Promise<{ data: string }>;
    getTotalSpaceUsed(): Promise<{
        image: StorageCategoryStats;
        document: StorageCategoryStats;
        video: StorageCategoryStats;
        audio: StorageCategoryStats;
        other: StorageCategoryStats;
        used: number;
        all: number;
    }>;
}

export interface Flashcard {
    id: string;
    documentId: string;
    front: string;
    back: string;
    createdAt: string;
    updatedAt: string;
}

export interface QuizAnswer {
    selectedOption: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    questionTitle: string;
    questionType: number;
    position: number;
    answers: QuizAnswer[];
}

export interface QuizResponse {
    quizTitle: string;
    questions: QuizQuestion[];
}

export interface QuizRecord {
    id: string;
    documentId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export interface SummaryResponse {
    summary: string;
}

export interface AiResultState {
    type: string;
    data?: {
        fileUrl?: string;
        quizTitle?: string;
        questions?: QuizQuestion[];
        deckTitle?: string;
        cards?: Flashcard[];
        summary?: string;
    };
}

export interface DeepResearchProps {
    files: File[];
    topic: string;
}

export interface ProcessFileAIProps {
    file: File_;
    endpoint: string;
    extraParams?: Record<string, string | number | boolean>;
}

export interface IAIService {
    executeAIFeature<T = unknown>(props: ProcessFileAIProps): Promise<T>;
    executeDeepResearch<T = unknown>(props: DeepResearchProps): Promise<T>;
    generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface TierMembership {
    id: string;
    tierName: string;
    storageLimitMb: number;
    aiTokens: number;
    createdAt: string;
    updatedAt: string;
}

export interface CurrentUserTier {
    tierId: string;
    tierName: string;
    storageLimitMb: number;
    aiTokens: number;
    tierExpireAt: string;
    currentStorageMb: number;
    currentAiTokensUsed: number;
}

export interface IPaymentService {
    getMembershipTiers(): Promise<TierMembership[]>;
    createCheckoutSession(tierId: string): Promise<void>;
    getCurrentUserTier(): Promise<CurrentUserTier>;
}