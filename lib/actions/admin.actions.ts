"use server";

import { revalidatePath } from "next/cache";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getCurrentUser } from "@/lib/actions/user.actions";
import { isAdmin } from "@/lib/admin/roles";
import {
    CreateUserSchema,
    UpdateUserSchema,
    AdminUserQuerySchema,
    AdminFileQuerySchema,
} from "@/lib/admin/validations";
import { parseStringify } from "@/lib/utils";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import type {
    AdminUser,
    AdminFile,
    SystemStats,
    AdminUserListResponse,
    AdminFileListResponse,
    UserRole,
} from "@/types/admin";
import { appwriteConfig } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite";
import { Query, ID } from "node-appwrite";

const isAppwrite = Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.MINIO_ENDPOINT,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "admin",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "smartstorepassword123",
    },
    forcePathStyle: true,
});
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "smartstore-files";

export class AdminPermissionError extends Error {
    constructor() {
        super("You do not have permission to perform this action.");
        this.name = "AdminPermissionError";
    }
}

export class AdminValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AdminValidationError";
    }
}

const requireAdmin = async () => {
    const user = await getCurrentUser();
    if (!user) throw new AdminPermissionError();
    if (!isAdmin(user)) throw new AdminPermissionError();
    return user;
};

const mapUserRow = (row: any): AdminUser => ({
    $id: row.id,
    accountId: row.account_id,
    email: row.email,
    fullName: row.full_name,
    username: row.username,
    avatar: row.avatar ?? undefined,
    role: (row.role ?? "user") as UserRole,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    filesCount: row.files_count !== undefined ? Number(row.files_count) : undefined,
    totalStorage: row.total_storage !== undefined ? Number(row.total_storage) : undefined,
});

const mapFileRow = (row: any): AdminFile => ({
    $id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    extension: row.extension,
    size: Number(row.size),
    accountId: row.account_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? undefined,
    ownerEmail: row.owner_email ?? undefined,
    $createdAt: new Date(row.created_at).toISOString(),
    $updatedAt: new Date(row.updated_at).toISOString(),
    users: row.users ?? [],
});

const buildOrderBy = (sort: string): { column: string; order: "ASC" | "DESC" } => {
    const [field, order] = sort.split("-");
    const direction = order?.toLowerCase() === "asc" ? "ASC" : "DESC";
    const fieldMap: Record<string, string> = {
        $createdAt: "u.created_at",
        name: "u.full_name",
        email: "u.email",
        role: "u.role",
    };
    return { column: fieldMap[field] ?? "u.created_at", order: direction };
};

const buildFileOrderBy = (sort: string): { column: string; order: "ASC" | "DESC" } => {
    const [field, order] = sort.split("-");
    const direction = order?.toLowerCase() === "asc" ? "ASC" : "DESC";
    const fieldMap: Record<string, string> = {
        $createdAt: "f.created_at",
        name: "f.name",
        size: "f.size",
        type: "f.type",
    };
    return { column: fieldMap[field] ?? "f.created_at", order: direction };
};

// =============================================================================
// USERS
// =============================================================================

export const getAdminUsers = async (rawQuery: unknown): Promise<AdminUserListResponse> => {
    await requireAdmin();

    const query = AdminUserQuerySchema.parse(rawQuery);
    const { column, order } = buildOrderBy(query.sort);
    const offset = (query.page - 1) * query.limit;

    const values: any[] = [];
    const conditions: string[] = [];

    if (query.search) {
        values.push(`%${query.search}%`);
        conditions.push(`(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR u.username ILIKE $${values.length})`);
    }
    if (query.role !== "all") {
        values.push(query.role);
        conditions.push(`u.role = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataQuery = `
        SELECT u.*,
               COALESCE(f_stats.files_count, 0) AS files_count,
               COALESCE(f_stats.total_storage, 0) AS total_storage
        FROM users u
        LEFT JOIN (
            SELECT owner_id, COUNT(*)::int AS files_count, COALESCE(SUM(size), 0)::bigint AS total_storage
            FROM files
            GROUP BY owner_id
        ) f_stats ON f_stats.owner_id = u.id
        ${whereClause}
        ORDER BY ${column} ${order}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    values.push(query.limit, offset);

    const countValues = values.slice(0, values.length - 2);
    const countQuery = `SELECT COUNT(*)::int AS total FROM users u ${whereClause}`;

    const [dataRes, countRes] = await Promise.all([
        pool.query(dataQuery, values),
        pool.query(countQuery, countValues),
    ]);

    return parseStringify({
        documents: dataRes.rows.map(mapUserRow),
        total: countRes.rows[0]?.total ?? 0,
    });
};

export const getAdminUserById = async (id: string): Promise<AdminUser | null> => {
    await requireAdmin();
    if (!id) return null;

    const res = await pool.query(
        `SELECT u.*,
                COALESCE(f_stats.files_count, 0) AS files_count,
                COALESCE(f_stats.total_storage, 0) AS total_storage
         FROM users u
         LEFT JOIN (
             SELECT owner_id, COUNT(*)::int AS files_count, COALESCE(SUM(size), 0)::bigint AS total_storage
             FROM files
             GROUP BY owner_id
         ) f_stats ON f_stats.owner_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [id]
    );

    return res.rows.length ? mapUserRow(res.rows[0]) : null;
};

export const createAdminUser = async (input: unknown): Promise<AdminUser> => {
    const me = await requireAdmin();
    const data = CreateUserSchema.parse(input);

    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [data.email]);
    if (existing.rows.length) {
        throw new AdminValidationError("A user with this email already exists.");
    }

    const id = uuidv4();
    const accountId = uuidv4();
    const hashed = await bcrypt.hash(data.password, 12);

    const res = await pool.query(
        `INSERT INTO users (id, account_id, email, full_name, username, avatar, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, accountId, data.email, data.fullName, data.username, avatarPlaceholderUrl, hashed, data.role]
    );

    revalidatePath("/admin/users");
    void me;
    return mapUserRow(res.rows[0]);
};

export const updateAdminUser = async (id: string, input: unknown): Promise<AdminUser> => {
    await requireAdmin();
    if (!id) throw new AdminValidationError("User id is required.");
    const data = UpdateUserSchema.parse(input);

    const existing = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
    if (!existing.rows.length) throw new AdminValidationError("User not found.");

    const updateValues: any[] = [data.fullName, data.username, data.email, data.role];
    let passwordClause = "";
    if (data.password && data.password.length > 0) {
        const hashed = await bcrypt.hash(data.password, 12);
        updateValues.push(hashed);
        passwordClause = `, password_hash = $${updateValues.length}`;
    }

    updateValues.push(id);
    const res = await pool.query(
        `UPDATE users
         SET full_name = $1, username = $2, email = $3, role = $4, updated_at = NOW() ${passwordClause}
         WHERE id = $${updateValues.length}
         RETURNING *`,
        updateValues
    );

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    return mapUserRow(res.rows[0]);
};

export const deleteAdminUser = async (id: string): Promise<{ status: string; deleted: { users: number; files: number } }> => {
    const me = await requireAdmin();
    if (!id) throw new AdminValidationError("User id is required.");
    if (id === me.$id) throw new AdminValidationError("You cannot delete your own account.");

    const filesRes = await pool.query("SELECT id, bucket_file_id FROM files WHERE owner_id = $1", [id]);
    const fileIds = filesRes.rows.map((r) => r.id);
    const bucketIds = filesRes.rows.map((r) => r.bucket_file_id).filter(Boolean);

    if (bucketIds.length) {
        await Promise.all(
            bucketIds.map((bucketFileId) =>
                s3
                    .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: bucketFileId }))
                    .catch((err) => {
                        console.error("[Admin] Failed to delete object:", bucketFileId, err);
                    })
            )
        );
    }

    const userDelete = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (!userDelete.rows.length) {
        throw new AdminValidationError("User not found.");
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/files");

    return parseStringify({
        status: "success",
        deleted: { users: userDelete.rowCount ?? 0, files: fileIds.length },
    });
};

// =============================================================================
// FILES
// =============================================================================

export const getAdminFiles = async (rawQuery: unknown): Promise<AdminFileListResponse> => {
    await requireAdmin();

    const query = AdminFileQuerySchema.parse(rawQuery);
    const { column, order } = buildFileOrderBy(query.sort);
    const offset = (query.page - 1) * query.limit;

    const values: any[] = [];
    const conditions: string[] = [];

    if (query.search) {
        values.push(`%${query.search}%`);
        conditions.push(`f.name ILIKE $${values.length}`);
    }
    if (query.type !== "all") {
        values.push(query.type);
        conditions.push(`f.type = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const dataValues = [...values, query.limit, offset];
    const dataQuery = `
        SELECT f.*, u.full_name AS owner_name, u.email AS owner_email
        FROM files f
        LEFT JOIN users u ON u.id = f.owner_id
        ${whereClause}
        ORDER BY ${column} ${order}
        LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `;

    const countQuery = `SELECT COUNT(*)::int AS total FROM files f ${whereClause}`;

    const [dataRes, countRes] = await Promise.all([
        pool.query(dataQuery, dataValues),
        pool.query(countQuery, values),
    ]);

    return parseStringify({
        documents: dataRes.rows.map(mapFileRow),
        total: countRes.rows[0]?.total ?? 0,
    });
};

export const deleteAdminFile = async (fileId: string): Promise<{ status: string }> => {
    await requireAdmin();
    if (!fileId) throw new AdminValidationError("File id is required.");

    const res = await pool.query("SELECT bucket_file_id FROM files WHERE id = $1", [fileId]);
    if (!res.rows.length) throw new AdminValidationError("File not found.");

    const bucketFileId = res.rows[0].bucket_file_id;
    await pool.query("DELETE FROM files WHERE id = $1", [fileId]);

    if (bucketFileId) {
        await s3
            .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: bucketFileId }))
            .catch((err) => console.error("[Admin] Failed to delete file object:", err));
    }

    revalidatePath("/admin/files");
    return parseStringify({ status: "success" });
};

// =============================================================================
// STATS
// =============================================================================

export const getSystemStats = async (): Promise<SystemStats> => {
    await requireAdmin();

    const [usersRes, adminsRes, filesRes, storageRes, recentUsersRes, recentFilesRes, growthRes] = await Promise.all([
        pool.query("SELECT COUNT(*)::int AS total FROM users"),
        pool.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin'"),
        pool.query("SELECT COUNT(*)::int AS total FROM files"),
        pool.query("SELECT type, COALESCE(SUM(size), 0)::bigint AS size FROM files GROUP BY type"),
        pool.query("SELECT * FROM users ORDER BY created_at DESC LIMIT 5"),
        pool.query(
            `SELECT f.*, u.full_name AS owner_name, u.email AS owner_email
             FROM files f LEFT JOIN users u ON u.id = f.owner_id
             ORDER BY f.created_at DESC LIMIT 5`
        ),
        pool.query(
            `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
             FROM files
             WHERE created_at >= NOW() - INTERVAL '14 days'
             GROUP BY 1
             ORDER BY 1 ASC`
        ),
    ]);

    const storageByType = {
        document: 0,
        image: 0,
        video: 0,
        audio: 0,
        other: 0,
    };
    let totalStorage = 0;
    storageRes.rows.forEach((row) => {
        const t = row.type as keyof typeof storageByType;
        const size = Number(row.size);
        if (t in storageByType) storageByType[t] = size;
        totalStorage += size;
    });

    return parseStringify({
        totalUsers: usersRes.rows[0]?.total ?? 0,
        totalAdmins: adminsRes.rows[0]?.total ?? 0,
        totalFiles: filesRes.rows[0]?.total ?? 0,
        totalStorage,
        storageByType,
        recentUsers: recentUsersRes.rows.map(mapUserRow),
        recentFiles: recentFilesRes.rows.map(mapFileRow),
        fileGrowth: growthRes.rows.map((row) => ({ date: row.date, count: row.count })),
    });
};

// =============================================================================
// APPWRITE-STYLE ALIASES (for completeness when running against Appwrite)
// =============================================================================
export const appwriteAdminHelpers = {
    listAllUsers: async (limit = 100) => {
        if (!isAppwrite) return [];
        const { databases } = await createAdminClient();
        const res = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            [Query.limit(limit)]
        );
        return res.documents;
    },
    createUser: async (data: { email: string; fullName: string; username: string; password: string; role: UserRole }) => {
        if (!isAppwrite) throw new Error("Appwrite is not enabled.");
        const { databases } = await createAdminClient();
        const hashed = await bcrypt.hash(data.password, 12);
        const accountId = ID.unique();
        return databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                email: data.email,
                fullName: data.fullName,
                username: data.username,
                avatar: avatarPlaceholderUrl,
                accountId,
                password_hash: hashed,
                role: data.role,
            }
        );
    },
};
