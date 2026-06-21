"use server";

/**
 * Admin module server actions.
 *
 * All read/write operations proxy to the AIStudyHub backend
 * (`AIStudyHub.API`) through the shared server-side client. The previous
 * implementation talked to a local Postgres database; that path has been
 * removed because the production data of record lives in the .NET
 * backend. We only retain the local Postgres bootstrap helpers that the
 * appwrite-style auth path may still need.
 *
 * Every public function performs an admin check before delegating to the
 * backend so the route layer can be relied on to enforce role-based
 * access even if it's bypassed from the client.
 *
 * NOTE: Next.js server-action files may only export async functions. The
 * error classes live in `@/lib/admin/errors` and are re-exported from
 * this module for backwards compatibility.
 */

import { revalidatePath } from "next/cache";
import { Pool } from "pg";

import { getCurrentUser } from "@/lib/actions/user.actions";
import { isAdmin, isAdminEmail } from "@/lib/admin/roles";
import { backendFetch, BackendApiError } from "@/lib/admin/api-client";
import { AdminBackendError, AdminPermissionError, AdminValidationError } from "@/lib/admin/errors";
import { parseStringify } from "@/lib/utils";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import type {
    AdminUser,
    AdminFile,
    AdminReport,
    AdminDashboard,
    AdminUserListResponse,
    AdminFileListResponse,
    AdminReportListResponse,
    UserRole,
    ReportStatus,
    DocumentModerationStatus,
} from "@/types/admin";

export {AdminBackendError, AdminPermissionError, AdminValidationError};

/* -------------------------------------------------------------------------- */
/* Permission helpers                                                          */
/* -------------------------------------------------------------------------- */

const requireAdmin = async () => {
    const user = await getCurrentUser();
    if (!user) throw new AdminPermissionError();
    if (!isAdmin(user)) throw new AdminPermissionError();
    return user;
};

const wrapBackendError = (error: unknown): never => {
    if (error instanceof BackendApiError) {
        throw new AdminBackendError(error.message, error.status, error.body);
    }
    const message = error instanceof Error ? error.message : "Unexpected backend error.";
    throw new AdminBackendError(message, 500, null);
};

const normalizeRole = (role: string | null | undefined): UserRole => {
    if (!role) return "user";
    return isAdminEmail(undefined) && role.toLowerCase() === "admin" ? "admin" : role.toLowerCase() === "admin" ? "admin" : "user";
};

const isUserAdmin = (role: string | null | undefined): boolean => {
    if (!role) return false;
    return ["admin", "Admin", "ADMIN"].includes(role);
};

/* -------------------------------------------------------------------------- */
/* Local Postgres helpers (only used to seed admin accounts & maintain the     */
/* role column used by NextAuth's session callback).                           */
/* -------------------------------------------------------------------------- */

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ensureLocalAdmin = async (userId: string) => {
    try {
        await pool.query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND role <> $1", ["admin", userId]);
    } catch (error) {
        // The local DB is optional; failures here are non-fatal for the
        // admin module because all real data lives in the .NET backend.
        console.warn("[admin] ensureLocalAdmin skipped:", (error as Error).message);
    }
};

/* -------------------------------------------------------------------------- */
/* Mappers                                                                     */
/* -------------------------------------------------------------------------- */

const mapUser = (raw: any): AdminUser => {
    const id = raw.id ?? raw.Id ?? "";
    const fullName = raw.fullName ?? raw.FullName ?? "Unknown";
    const email = raw.email ?? raw.Email ?? "";
    const createdAt = raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString();
    const updatedAt = raw.updatedAt ?? raw.UpdatedAt ?? null;
    return {
        id,
        fullName,
        email,
        role: normalizeRole(raw.role ?? raw.Role),
        status: raw.status ?? raw.Status,
        currentStorageCapacity: raw.currentStorageCapacity ?? raw.CurrentStorageCapacity,
        currentAiTokenUsage: raw.currentAiTokenUsage ?? raw.CurrentAiTokenUsage,
        tierId: raw.tierId ?? raw.TierId,
        tierName: raw.tierName ?? raw.TierName,
        tierStorageLimitMb: raw.tierStorageLimitMb ?? raw.TierStorageLimitMb,
        tierAiTokens: raw.tierAiTokens ?? raw.TierAiTokens,
        tierExpireAt: raw.tierExpireAt ?? raw.TierExpireAt ?? null,
        tier: raw.tier ?? raw.Tier ?? raw.tierName ?? raw.TierName ?? "Free",
        createdAt,
        updatedAt,
        avatar: raw.avatar ?? undefined,
        username: raw.username ?? (email ? email.split("@")[0] : undefined),
        // Legacy aliases consumed by the existing user row component.
        $id: id,
        accountId: id,
        filesCount: undefined,
        totalStorage: undefined,
    };
};

const deriveDocumentStatus = (raw: any): DocumentModerationStatus => {
    const backend = (raw.status ?? raw.Status ?? "").toString();
    if (backend === "Banned") return "removed";
    if (backend === "Archived") return "hidden";
    return "active";
};

const mapFile = (raw: any): AdminFile => {
    const id = raw.id ?? raw.Id ?? "";
    const userId = raw.userId ?? raw.UserId ?? "";
    const title = raw.title ?? raw.Title ?? "Untitled";
    const fileLink = raw.fileLink ?? raw.FileLink ?? null;
    const fileExtension = raw.fileExtension ?? raw.FileExtension ?? null;
    const fileType = raw.fileType ?? raw.FileType ?? null;
    const createdAt = raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString();
    const updatedAt = raw.updatedAt ?? raw.UpdatedAt ?? null;
    const sharedUsers = raw.sharedUsers ?? raw.SharedUsers;
    const parsedSharedUsers = typeof sharedUsers === "string"
        ? sharedUsers.split(",").map((s) => s.trim()).filter(Boolean)
        : Array.isArray(sharedUsers)
        ? sharedUsers
        : [];
    const size = typeof raw.size === "number" ? raw.size : 0;
    const fileTypeCategory = fileType
        ? fileType.toLowerCase().startsWith("image/")
            ? "image"
            : fileType.toLowerCase().startsWith("video/")
            ? "video"
            : fileType.toLowerCase().startsWith("audio/")
            ? "audio"
            : "document"
        : "document";

    return {
        id,
        userId,
        subjectId: raw.subjectId ?? raw.SubjectId,
        title,
        fileName: raw.fileName ?? raw.FileName ?? null,
        fileLink,
        fileExtension,
        fileType,
        shareStatus: raw.shareStatus ?? raw.ShareStatus,
        sharedUsers,
        status: raw.status ?? raw.Status ?? null,
        voteCount: raw.voteCount ?? raw.VoteCount,
        createdAt,
        updatedAt,
        reportCount: raw.reportCount,
        // Legacy aliases consumed by the existing file/document row components.
        $id: id,
        name: title,
        url: fileLink ?? "",
        type: fileTypeCategory,
        extension: fileExtension ?? undefined,
        size,
        ownerId: userId,
        ownerName: raw.ownerName,
        ownerEmail: raw.ownerEmail,
        ownerAvatar: raw.ownerAvatar,
        $createdAt: createdAt,
        $updatedAt: updatedAt ?? undefined,
        users: parsedSharedUsers,
    };
};

const mapReport = (raw: any): AdminReport => {
    const id = raw.id ?? raw.Id ?? "";
    const userId = raw.userId ?? raw.UserId ?? "";
    const documentId = raw.documentId ?? raw.DocumentId ?? "";
    const createdAt = raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString();
    const updatedAt = raw.updatedAt ?? raw.UpdatedAt ?? null;
    return {
        id,
        userId,
        documentId,
        reason: raw.reason ?? raw.Reason ?? null,
        createdAt,
        updatedAt,
        status: raw.status,
        reporterName: raw.reporterName,
        reporterEmail: raw.reporterEmail,
        reporterAvatar: raw.reporterAvatar,
        documentTitle: raw.documentTitle,
        documentFileName: raw.documentFileName,
        documentExtension: raw.documentExtension,
        documentOwnerName: raw.documentOwnerName,
        documentOwnerEmail: raw.documentOwnerEmail,
        // Legacy aliases consumed by the existing row component.
        $id: id,
        documentName: raw.documentTitle ?? raw.documentFileName ?? raw.DocumentTitle,
    };
};

/* -------------------------------------------------------------------------- */
/* USERS                                                                       */
/* -------------------------------------------------------------------------- */

export const getAdminUsers = async (rawQuery: unknown = {}): Promise<AdminUserListResponse> => {
    await requireAdmin();
    const query = (rawQuery ?? {}) as {
        search?: string;
        role?: string;
        sort?: string;
        page?: number;
        limit?: number;
    };
    const keyword = (query.search ?? "").toString().trim();

    try {
        const users = await backendFetch<any[]>("/api/User", {
            method: "GET",
            query: keyword ? { keyword } : undefined,
        });
        const filtered = (query.role && query.role !== "all" && query.role !== "any"
            ? users.filter((u) => {
                const r = (u.role ?? u.Role ?? "").toString().toLowerCase();
                return query.role === "admin" ? r === "admin" : r !== "admin";
            })
            : users);
        const mapped = filtered.map(mapUser);

        const sortKey = (query.sort ?? "$createdAt-desc").toString();
        const [field, order] = sortKey.split("-");
        const dir = (order ?? "desc").toLowerCase() === "asc" ? 1 : -1;
        const sortField = field?.toLowerCase();
        mapped.sort((a, b) => {
            switch (sortField) {
                case "name":
                    return dir * a.fullName.localeCompare(b.fullName);
                case "email":
                    return dir * a.email.localeCompare(b.email);
                case "role":
                    return dir * a.role.localeCompare(b.role);
                default:
                    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            }
        });

        return parseStringify({ documents: mapped, total: mapped.length });
    } catch (error) {
        if (error instanceof AdminPermissionError) throw error;
        if (error instanceof BackendApiError) {
            if (error.status === 404) return parseStringify({ documents: [], total: 0 });
        }
        wrapBackendError(error);
    }
    // Unreachable; the helper throws.
    throw new AdminBackendError("Unexpected error while loading users.", 500, null);
};

export const getAdminUserById = async (id: string): Promise<AdminUser | null> => {
    await requireAdmin();
    if (!id) return null;
    try {
        const raw = await backendFetch<any>(`/api/User/${id}`, {method: "GET"});
        return mapUser(raw);
    } catch (error) {
        if (error instanceof BackendApiError && error.status === 404) return null;
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while loading user.", 500, null);
};

export const updateAdminUserTier = async (id: string, tierId: string, tierExpireAt?: string | null): Promise<void> => {
    await requireAdmin();
    if (!id) throw new AdminValidationError("User id is required.");
    if (!tierId) throw new AdminValidationError("Tier id is required.");
    try {
        await backendFetch(`/api/User/${id}/tier`, {
            method: "PUT",
            body: {tierId, tierExpireAt: tierExpireAt ?? null},
        });
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${id}`);
    } catch (error) {
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while updating user tier.", 500, null);
};

/* -------------------------------------------------------------------------- */
/* FILES / DOCUMENT VIOLATIONS                                                 */
/* -------------------------------------------------------------------------- */

const parseFileQuery = (rawQuery: unknown) => {
    const query = (rawQuery ?? {}) as Record<string, any>;
    return {
        search: (query.search ?? "").toString().trim() || undefined,
        type: (query.type ?? "all").toString(),
        status: (query.status ?? "all").toString(),
        sort: (query.sort ?? "$createdAt-desc").toString(),
        page: Number(query.page ?? 1),
        limit: Number(query.limit ?? 20),
    };
};

export const getAdminFiles = async (rawQuery: unknown = {}): Promise<AdminFileListResponse> => {
    await requireAdmin();
    const query = parseFileQuery(rawQuery);

    try {
        const raw = await backendFetch<any[]>("/api/Admin/documents", {
            method: "GET",
            query: query.search ? {keyword: query.search} : undefined,
        });

        let mapped = (raw ?? []).map(mapFile);

        if (query.type && query.type !== "all") {
            const allowed = query.type.toLowerCase();
            mapped = mapped.filter((file) => {
                const fileType = (file.fileType ?? "").toLowerCase();
                if (fileType) {
                    return fileType.startsWith(allowed);
                }
                return file.type === allowed;
            });
        }

        if (query.status && query.status !== "all") {
            const bannedPredicate = (file: AdminFile) => {
                const backend = (file.status ?? "").toString().toLowerCase();
                if (backend === "banned" || backend === "removed") return true;
                return false;
            };
            mapped = mapped.filter((file) =>
                query.status === "removed" ? bannedPredicate(file) : !bannedPredicate(file),
            );
        }

        const [field, order] = query.sort.split("-");
        const dir = (order ?? "desc").toLowerCase() === "asc" ? 1 : -1;
        const sortField = field?.toLowerCase();
        mapped.sort((a, b) => {
            switch (sortField) {
                case "name":
                    return dir * (a.name ?? "").localeCompare(b.name ?? "");
                case "size":
                    return dir * ((a.size ?? 0) - (b.size ?? 0));
                case "type":
                    return dir * (a.type ?? "").localeCompare(b.type ?? "");
                default:
                    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            }
        });

        const total = mapped.length;
        const offset = Math.max(0, (query.page - 1) * query.limit);
        const documents = mapped.slice(offset, offset + query.limit);

        return parseStringify({documents, total});
    } catch (error) {
        if (error instanceof BackendApiError && error.status === 404) {
            return parseStringify({documents: [], total: 0});
        }
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while loading files.", 500, null);
};

export const getAdminFileById = async (id: string): Promise<AdminFile | null> => {
    await requireAdmin();
    if (!id) return null;
    try {
        const raw = await backendFetch<any>(`/api/Document/${id}`, {method: "GET"});
        return mapFile(raw);
    } catch (error) {
        if (error instanceof BackendApiError && error.status === 404) return null;
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while loading file.", 500, null);
};

export const deleteAdminFile = async (fileId: string): Promise<{status: string}> => {
    await requireAdmin();
    if (!fileId) throw new AdminValidationError("File id is required.");
    try {
        await backendFetch(`/api/Document/${fileId}`, {method: "DELETE"});
        revalidatePath("/admin/files");
        revalidatePath("/admin/document-violations");
        return parseStringify({status: "success"});
    } catch (error) {
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while deleting file.", 500, null);
};

export const banAdminDocument = async (documentId: string): Promise<{status: string; message?: string}> => {
    await requireAdmin();
    if (!documentId) throw new AdminValidationError("Document id is required.");
    try {
        const response = await backendFetch<{message?: string}>(`/api/Admin/documents/${documentId}/ban`, {
            method: "PUT",
        });
        revalidatePath("/admin/document-violations");
        revalidatePath("/admin/files");
        return parseStringify({status: "success", message: response?.message});
    } catch (error) {
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while banning document.", 500, null);
};

export const unbanAdminDocument = async (documentId: string): Promise<{status: string}> => {
    await requireAdmin();
    if (!documentId) throw new AdminValidationError("Document id is required.");
    try {
        await backendFetch(`/api/Document/${documentId}`, {
            method: "PUT",
            body: {
                title: "Updated",
                shareStatus: "private",
            },
        });
        revalidatePath("/admin/document-violations");
        revalidatePath("/admin/files");
        return parseStringify({status: "success"});
    } catch (error) {
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while unbanning document.", 500, null);
};

/* -------------------------------------------------------------------------- */
/* REPORTS (REPORT VIOLATIONS)                                                 */
/* -------------------------------------------------------------------------- */

const fetchUserSafely = async (userId: string): Promise<AdminUser | null> => {
    if (!userId) return null;
    try {
        return await getAdminUserById(userId);
    } catch {
        return null;
    }
};

const fetchDocumentSafely = async (documentId: string): Promise<AdminFile | null> => {
    if (!documentId) return null;
    try {
        return await getAdminFileById(documentId);
    } catch {
        return null;
    }
};

export const getAdminReports = async (rawQuery: unknown = {}): Promise<AdminReportListResponse> => {
    await requireAdmin();
    const query = (rawQuery ?? {}) as {
        search?: string;
        status?: string;
        sort?: string;
        page?: number;
        limit?: number;
    };

    try {
        const raw = await backendFetch<any[]>("/api/Report", {method: "GET"});
        const reports = (raw ?? []).map(mapReport);

        // The BE-SWP Report DTO only carries ids. Enrich the payload with
        // reporter and document metadata so the table view can show useful
        // columns. Failures here are non-fatal – we still surface the row
        // with id-only data so the moderator can drill into the detail.
        const enriched = await Promise.all(
            reports.map(async (report) => {
                const [reporter, document] = await Promise.all([
                    fetchUserSafely(report.userId),
                    fetchDocumentSafely(report.documentId),
                ]);
                return {
                    ...report,
                    reporterName: reporter?.fullName,
                    reporterEmail: reporter?.email,
                    documentTitle: document?.title ?? document?.name,
                    documentFileName: document?.fileName ?? document?.name,
                    documentExtension: document?.fileExtension ?? undefined,
                    documentOwnerName: document?.ownerName,
                    documentOwnerEmail: document?.ownerEmail,
                } satisfies AdminReport;
            })
        );

        let filtered = enriched;
        if (query.search) {
            const term = query.search.toLowerCase();
            filtered = filtered.filter((r) =>
                [
                    r.reporterName,
                    r.reporterEmail,
                    r.documentTitle,
                    r.documentFileName,
                    r.reason,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(term))
            );
        }
        if (query.status && query.status !== "all") {
            filtered = filtered.filter((r) => (r.status ?? "pending") === query.status);
        }

        const [field, order] = (query.sort ?? "$createdAt-desc").toString().split("-");
        const dir = (order ?? "desc").toLowerCase() === "asc" ? 1 : -1;
        const sortField = field?.toLowerCase();
        filtered.sort((a, b) => {
            switch (sortField) {
                case "status":
                    return dir * (a.status ?? "").localeCompare(b.status ?? "");
                default:
                    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            }
        });

        const total = filtered.length;
        const limit = Math.max(1, query.limit ?? 20);
        const offset = Math.max(0, ((query.page ?? 1) - 1) * limit);
        const documents = filtered.slice(offset, offset + limit);

        return parseStringify({documents, total});
    } catch (error) {
        if (error instanceof BackendApiError && error.status === 404) {
            return parseStringify({documents: [], total: 0});
        }
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while loading reports.", 500, null);
};

export const getAdminReportById = async (id: string): Promise<AdminReport | null> => {
    await requireAdmin();
    if (!id) return null;
    try {
        const raw = await backendFetch<any>(`/api/Report/${id}`, {method: "GET"});
        const report = mapReport(raw);
        const [reporter, document] = await Promise.all([
            fetchUserSafely(report.userId),
            fetchDocumentSafely(report.documentId),
        ]);
        return {
            ...report,
            reporterName: reporter?.fullName,
            reporterEmail: reporter?.email,
            documentTitle: document?.title ?? document?.name,
            documentFileName: document?.fileName ?? document?.name,
            documentExtension: document?.fileExtension ?? undefined,
            documentOwnerName: document?.ownerName,
            documentOwnerEmail: document?.ownerEmail,
        };
    } catch (error) {
        if (error instanceof BackendApiError && error.status === 404) return null;
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while loading report.", 500, null);
};

/* -------------------------------------------------------------------------- */
/* STATS                                                                       */
/* -------------------------------------------------------------------------- */

const computeLocalUserCounts = async (): Promise<{total: number; admins: number}> => {
    try {
        const [totalRes, adminsRes] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS total FROM users"),
            pool.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin'"),
        ]);
        return {
            total: totalRes.rows[0]?.total ?? 0,
            admins: adminsRes.rows[0]?.total ?? 0,
        };
    } catch {
        return {total: 0, admins: 0};
    }
};

export const getSystemStats = async (): Promise<AdminDashboard> => {
    await requireAdmin();
    try {
        const [dashboard, local] = await Promise.all([
            backendFetch<any>("/api/Admin/dashboard", {method: "GET"}),
            computeLocalUserCounts(),
        ]);
        const mapped: AdminDashboard = {
            totalUsers: dashboard.totalUsers ?? dashboard.TotalUsers ?? local.total,
            totalDocuments: dashboard.totalDocuments ?? dashboard.TotalDocuments ?? 0,
            totalPayments: dashboard.totalPayments ?? dashboard.TotalPayments ?? 0,
            pendingPayments: dashboard.pendingPayments ?? dashboard.PendingPayments ?? 0,
            completedPayments: dashboard.completedPayments ?? dashboard.CompletedPayments ?? 0,
            totalReports: dashboard.totalReports ?? dashboard.TotalReports ?? 0,
            totalFlashcards: dashboard.totalFlashcards ?? dashboard.TotalFlashcards ?? 0,
            totalQuizzes: dashboard.totalQuizzes ?? dashboard.TotalQuizzes ?? 0,
            generatedAt: dashboard.generatedAt ?? dashboard.GeneratedAt ?? new Date().toISOString(),
        };
        return parseStringify(mapped);
    } catch (error) {
        if (error instanceof BackendApiError) {
            // Fall back to local-only stats when the backend isn't reachable.
            const local = await computeLocalUserCounts();
            return parseStringify({
                totalUsers: local.total,
                totalDocuments: 0,
                totalPayments: 0,
                pendingPayments: 0,
                completedPayments: 0,
                totalReports: 0,
                totalFlashcards: 0,
                totalQuizzes: 0,
                generatedAt: new Date().toISOString(),
            });
        }
        wrapBackendError(error);
    }
    throw new AdminBackendError("Unexpected error while loading stats.", 500, null);
};

/* -------------------------------------------------------------------------- */
/* Backwards-compat re-export                                                  */
/* -------------------------------------------------------------------------- */
