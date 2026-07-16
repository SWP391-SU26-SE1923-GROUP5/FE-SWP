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
    avatar?: string;
    username?: string;
    accountId?: string;
    $id?: string;
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
    dateOfBirth: string;
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
    getShareableUsers(keyword?: string): Promise<User[]>;
    signOutUser(): Promise<void>;
    verifyOtp(props: VerifyOtpProps): Promise<string>;
    resendOtp(props: { email: string }): Promise<string>;
    forgotPassword(props: { email: string }): Promise<string>;
    verifyPasswordResetOtp(props: { email: string; otp: string }): Promise<string>;
    resetPassword(props: { email: string; otp: string; newPassword: string }): Promise<string>;
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
    levels?: number[];
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
    getDocumentShares(fileId: string): Promise<any[]>;
    revokeDocumentShare(fileId: string, targetUserId: string, path?: string): Promise<boolean>;
    updateEditedFile(props: UpdateEditedFileProps): Promise<UploadFileResponse | undefined>;
    deleteFile(props: DeleteFileProps): Promise<{ status: string } | undefined>;
    downloadFile(props: DownloadFileProps): Promise<{ data: string; contentType?: string }>;
    previewFile(props: DownloadFileProps): Promise<{ data: string; contentType?: string }>;
    getTotalSpaceUsed(): Promise<{
        image: StorageCategoryStats;
        document: StorageCategoryStats;
        video: StorageCategoryStats;
        audio: StorageCategoryStats;
        other: StorageCategoryStats;
        used: number;
        all: number;
    }>;
    getFileStatus(fileId: string): Promise<{ id: string; status: number; errorMessage?: string } | null>;
    reprocessFile(fileId: string): Promise<{ documentId: string; status: string; message: string } | null>;
    getTrashFiles(): Promise<{ documents: File_[] }>;
    restoreFile(props: { fileId: string; path?: string }): Promise<{ status: string } | undefined>;
    permanentDeleteFile(props: { fileId: string; path?: string }): Promise<{ status: string } | undefined>;
}

export interface Flashcard {
    id: string;
    documentId: string;
    front: string;
    back: string;
    createdAt: string;
    updatedAt: string;
}

export interface FlashcardReviewResponse {
    reviewId: string;
    flashcardId: string;
    nextReviewDate: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
}

export interface ReviewFlashcardResult {
    review: FlashcardReviewResponse;
    xpEarned: number;
    newAchievements: AchievementDto[];
}

export interface DueFlashcard {
    reviewId: string;
    flashcardId: string;
    documentId: string;
    front: string;
    back: string;
    nextReviewDate: string;
}

export interface FlashcardReviewStats {
    totalReviewed: number;
    dueNow: number;
    masteredCount: number;
    averageEaseFactor: number;
}

export interface QuizAnswer {
    selectedOption: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    id?: string;
    questionTitle: string;
    questionType: number;
    position: number;
    answers: QuizAnswer[];
}

export interface QuizResponse {
    id?: string;
    quizId?: string;
    documentId?: string;
    title?: string;
    documentName?: string;
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

export interface QuizSubmissionResponse {
    id: string;
    userId: string;
    quizId: string;
    answers: string;
    score: number;
    maxScore: number;
    totalCorrect: number;
    gradedAt?: string | null;
    submittedAt: string;
    createdAt: string;
    updatedAt?: string | null;
}

export interface LevelUpToast {
    newLevel: number;
    title?: string;
    message?: string;
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
    price?: number;
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

// ==================== ANALYTICS TYPES ====================
export interface DashboardKpiDto {
    totalStudyHours: number;
    totalStudyMinutes: number;
    cardsReviewed: number;
    averageAccuracy: number;
    efficiencyScore: number;
    currentStreakDays: number;
    flashcardsDueToday?: number | null;
}

export interface DashboardChartPointDto {
    date: string;
    accuracyPercent?: number | null;
    cardsCount: number;
}

export interface DashboardSubjectMasteryDto {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    masteryPercent: number;
}

export interface AiTipDto {
    severity: "info" | "warning" | "danger" | string;
    title: string;
    message: string;
}

export interface DashboardDto {
    kpis: DashboardKpiDto;
    accuracyTrend: DashboardChartPointDto[];
    cardsReviewedTrend: DashboardChartPointDto[];
    subjectMasteries: DashboardSubjectMasteryDto[];
    aiTips: AiTipDto[];
}

export interface IAnalyticsService {
    getDashboard(): Promise<DashboardDto | null>;
}

export interface NotificationResponseDto {
    id: string;
    userId: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
    updatedAt?: string | null;
}

export interface INotificationService {
    getMyNotifications(): Promise<NotificationResponseDto[]>;
    markAsRead(id: string): Promise<boolean>;
    markAllAsRead(): Promise<boolean>;
}

export interface LeaderboardEntryDto {
    userId: string;
    fullName: string;
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    rank: number;
}

export interface UserStatsResponseDto {
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    bestStreak: number;
    lastActivityDate?: string | null;
    xpToNextLevel: number;
}

export interface IGamificationService {
    getLeaderboard(top?: number, period?: string): Promise<LeaderboardEntryDto[]>;
    getMyStats(): Promise<UserStatsResponseDto | null>;
}

export interface UserTierInfoDto {
    tierId: string;
    tierName: string;
    storageLimitMb: number;
    aiTokens: number;
    tierExpireAt?: string | null;
    currentStorageMb: number;
    currentAiTokensUsed: number;
}

export interface AchievementDto {
    id: string;
    code: string;
    title: string;
    description: string;
    category: string;
    targetValue: number;
    iconUrl: string;
    xpReward: number;
    isUnlocked: boolean;
    earnedDate?: string | null;
    currentProgress: number;
}

export interface IProfileService {
    getMyTierInfo(): Promise<UserTierInfoDto | null>;
    getMyAchievements(): Promise<AchievementDto[]>;
}