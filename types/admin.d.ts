export type UserRole = "user" | "admin";

export interface AdminUser {
    $id: string;
    accountId: string;
    email: string;
    fullName: string;
    username: string;
    avatar?: string;
    role: UserRole;
    createdAt?: string;
    filesCount?: number;
    totalStorage?: number;
}

export interface AdminFile {
    $id: string;
    name: string;
    url: string;
    type: string;
    extension: string;
    size: number;
    accountId: string;
    ownerId: string;
    ownerName?: string;
    ownerEmail?: string;
    $createdAt: string;
    $updatedAt: string;
    users: string[];
}

export interface SystemStats {
    totalUsers: number;
    totalAdmins: number;
    totalFiles: number;
    totalStorage: number;
    storageByType: {
        document: number;
        image: number;
        video: number;
        audio: number;
        other: number;
    };
    recentUsers: AdminUser[];
    recentFiles: AdminFile[];
    fileGrowth: { date: string; count: number }[];
}

export interface AdminUserListResponse {
    documents: AdminUser[];
    total: number;
}

export interface AdminFileListResponse {
    documents: AdminFile[];
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
