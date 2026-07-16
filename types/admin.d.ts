/**
 * Admin module types.
 *
 * These types mirror the DTOs exposed by the AIStudyHub backend
 * (BE-SWP) so the admin frontend can consume them without ad-hoc
 * reshaping at every call site. The backend uses `Guid` for ids
 * (serialised as JSON strings), ISO-8601 strings for timestamps and
 * string-backed enum names (DocumentStatus, ReportStatus, UserRole).
 *
 * To keep the existing admin UI stable, the type also exposes a few
 * legacy aliases (e.g. `name`, `extension`, `size`) that the row
 * components still rely on. They are derived from the canonical
 * fields at the mapper layer in `lib/actions/admin.actions.ts`.
 */

export type UserRole = "user" | "admin";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected";

export type DocumentModerationStatus = "active" | "hidden" | "removed";

export type DocumentBackendStatus =
    | "Draft"
    | "Published"
    | "Archived"
    | "Banned"
    | "Processing"
    | "Failed"
    | string;

export interface AdminUser {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status?: string;
    currentStorageCapacity?: number;
    currentAiTokenUsage?: number;
    tierId?: string;
    tierName?: string;
    tierStorageLimitMb?: number;
    tierAiTokens?: number;
    tierExpireAt?: string | null;
    tier?: string;
    createdAt: string;
    updatedAt?: string | null;
    avatar?: string;
    username?: string;
    // Legacy aliases consumed by the user row component.
    $id?: string;
    accountId?: string;
    filesCount?: number;
    totalStorage?: number;
}

export interface AdminFile {
    id: string;
    userId: string;
    subjectId?: string;
    title: string;
    fileName?: string | null;
    fileLink?: string | null;
    fileExtension?: string | null;
    fileType?: string | null;
    shareStatus?: string;
    sharedUsers?: string;
    status?: DocumentBackendStatus | null;
    voteCount?: number;
    createdAt: string;
    updatedAt?: string | null;
    reportCount?: number;
    // Legacy aliases consumed by the existing row components.
    $id?: string;
    name?: string;
    url?: string;
    type?: string;
    extension?: string;
    size?: number;
    ownerId?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerAvatar?: string;
    $createdAt?: string;
    $updatedAt?: string;
    users?: string[];
}

export interface AdminReport {
    id: string;
    userId: string;
    documentId: string;
    reason: string | null;
    createdAt: string;
    updatedAt: string | null;
    status?: ReportStatus;
    reporterName?: string;
    reporterEmail?: string;
    reporterAvatar?: string;
    documentTitle?: string;
    documentFileName?: string;
    documentExtension?: string;
    documentOwnerName?: string;
    documentOwnerEmail?: string;
    // Legacy aliases.
    $id?: string;
    documentName?: string;
}

export interface AdminDashboard {
    totalUsers: number;
    totalDocuments: number;
    totalPayments: number;
    pendingPayments: number;
    completedPayments: number;
    totalReports: number;
    totalFlashcards: number;
    totalQuizzes: number;
    generatedAt: string;
}

export interface AdminUserListResponse {
    documents: AdminUser[];
    total: number;
}

export interface AdminFileListResponse {
    documents: AdminFile[];
    total: number;
}

export interface AdminReportListResponse {
    documents: AdminReport[];
    total: number;
}

export interface ApiSuccess<T> {
    success: true;
    data: T;
}

export interface ApiError {
    success: false;
    error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
