import { IFileStorage, DeleteFileProps, GetFilesProps, RenameFileProps, UpdateFileUsersProps, UploadFileProps, UpdateEditedFileProps } from "@/types";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { getFileType } from "@/lib/utils";
import { getCurrentUser } from "@/lib/actions/user.actions";
import eventBus, { EVENTS } from "@/lib/event-bus";
import { revalidatePath } from "next/cache";

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.MINIO_ENDPOINT,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "admin",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "smartstorepassword123"
    },
    forcePathStyle: true,
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "smartstore-files";

export class LocalStorage implements IFileStorage {

    async uploadFile({ file, ownerId, accountId, path }: UploadFileProps) {
        try {
            const bucketFileId = uuidv4();
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileTypeInfo = getFileType(file.name);

            await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: bucketFileId, Body: buffer, ContentType: file.type }));
            const url = `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${bucketFileId}`;
            const id = uuidv4();

            const result = await pool.query(
                `INSERT INTO files (id, name, url, type, bucket_file_id, account_id, owner_id, extension, size) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;`,
                [id, file.name, url, fileTypeInfo.type, bucketFileId, accountId, ownerId, fileTypeInfo.extension, file.size]
            );

            const newFile = this.mapToFile(result.rows[0]);
            eventBus.emit(EVENTS.FILE_CREATED, { fileId: newFile.$id, accountId, bucketFileId, mimeType: file.type });
            revalidatePath(path);

            return JSON.parse(JSON.stringify(newFile));
        } catch (error) { console.error("[Local Storage] Upload Error:", error); throw error; }
    }

    async getFiles({ types = [], searchText = "", sort = "$createdAt-desc", limit }: GetFilesProps) {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("Current user does not exist");

            let query = `SELECT * FROM files WHERE (owner_id = $1 OR $2 = ANY(users))`;
            const values: any[] = [currentUser.$id, currentUser.email];
            let paramCount = 3;

            if (types.length > 0) { query += ` AND type = ANY($${paramCount})`; values.push(types); paramCount++; }
            if (searchText) { query += ` AND name ILIKE $${paramCount}`; values.push(`%${searchText}%`); paramCount++; }

            const [sortBy, orderBy] = sort.split('-');
            const dbSortColumn = sortBy === '$createdAt' ? 'created_at' : 'name';
            query += ` ORDER BY ${dbSortColumn} ${orderBy.toUpperCase()}`;

            if (limit) { query += ` LIMIT $${paramCount}`; values.push(limit); }

            const result = await pool.query(query, values);
            const documents = result.rows.map(row => this.mapToFile(row));

            return JSON.parse(JSON.stringify({ documents, total: documents.length }));
        } catch (error) { console.error("[Local Storage] GetFiles Error:", error); throw error; }
    }

    async renameFile({ fileId, name, extension, path }: RenameFileProps) {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User not authenticated");

            const newName = `${name}.${extension}`;
            const result = await pool.query(
                `UPDATE files SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
                [newName, fileId]
            );

            if (!result.rows.length) throw new Error("File not found");

            eventBus.emit(EVENTS.FILE_RENAMED, { fileId, accountId: currentUser.accountId, newName });
            revalidatePath(path);

            return JSON.parse(JSON.stringify(this.mapToFile(result.rows[0])));
        } catch (error) { console.error("[Local Storage] Rename Error:", error); throw error; }
    }

    async updateFileUsers({ fileId, emails, path }: UpdateFileUsersProps) {
        try {
            const result = await pool.query(
                `UPDATE files SET users = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
                [emails, fileId]
            );

            if (!result.rows.length) throw new Error("File not found");

            revalidatePath(path);
            return JSON.parse(JSON.stringify(this.mapToFile(result.rows[0])));
        } catch (error) { console.error("[Local Storage] Update Users Error:", error); throw error; }
    }

    async updateEditedFile({ fileId, oldBucketFileId, file, path }: UpdateEditedFileProps) {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User not authenticated");

            const newBucketFileId = uuidv4();
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: newBucketFileId, Body: buffer, ContentType: file.type }));
            const newUrl = `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/${newBucketFileId}`;
            const fileTypeInfo = getFileType(file.name);

            const result = await pool.query(
                `UPDATE files SET bucket_file_id = $1, url = $2, size = $3, extension = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
                [newBucketFileId, newUrl, file.size, fileTypeInfo.extension, fileId]
            );

            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldBucketFileId }));

            eventBus.emit(EVENTS.FILE_DELETED, { fileId, accountId: currentUser.accountId });
            eventBus.emit(EVENTS.FILE_CREATED, { fileId, accountId: currentUser.accountId, fileUrl: newUrl, mimeType: file.type });

            revalidatePath(path);
            return JSON.parse(JSON.stringify(this.mapToFile(result.rows[0])));
        } catch (error) { console.error("[Local Storage] Update Edited File Error:", error); throw error; }
    }

    async deleteFile({ fileId, bucketFileId, path }: DeleteFileProps) {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User not authenticated");

            const result = await pool.query(`DELETE FROM files WHERE id = $1 RETURNING id`, [fileId]);

            if (result.rows.length) {
                await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: bucketFileId }));
            }

            eventBus.emit(EVENTS.FILE_DELETED, { fileId, accountId: currentUser.accountId });
            revalidatePath(path);

            return JSON.parse(JSON.stringify({ status: "success" }));
        } catch (error) { console.error("[Local Storage] Delete Error:", error); throw error; }
    }

    async getTotalSpaceUsed() {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("User is not authenticated.");

            const result = await pool.query(`SELECT type, size, updated_at FROM files WHERE owner_id = $1`, [currentUser.$id]);

            const totalSpace = {
                image: { size: 0, latestDate: "" }, document: { size: 0, latestDate: "" },
                video: { size: 0, latestDate: "" }, audio: { size: 0, latestDate: "" },
                other: { size: 0, latestDate: "" }, used: 0, all: 2 * 1024 * 1024 * 1024 // 2GB limit
            };

            result.rows.forEach((row) => {
                const fileType = row.type as keyof typeof totalSpace;
                const fileSize = Number(row.size); // PG BigInt is returned as a string, must cast to Number

                if (typeof totalSpace[fileType] === 'object') {
                    (totalSpace[fileType] as any).size += fileSize;

                    const rowDate = row.updated_at.toISOString();
                    if (!(totalSpace[fileType] as any).latestDate || new Date(rowDate) > new Date((totalSpace[fileType] as any).latestDate)) {
                        (totalSpace[fileType] as any).latestDate = rowDate;
                    }
                }
                totalSpace.used += fileSize;
            });

            return JSON.parse(JSON.stringify(totalSpace));
        } catch (error) { console.error("[Local Storage] Get Total Space Error:", error); throw error; }
    }

    async getFileBuffer(bucketFileId: string): Promise<Buffer> {
        try {
            const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "smartstore-files";

            const response = await s3.send(new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: bucketFileId
            }));

            const byteArray = await response.Body?.transformToByteArray();

            if (!byteArray) throw new Error("File body is empty");
            return Buffer.from(byteArray);

        } catch (error) {
            console.error("[Local Storage] Get File Buffer Error:", error);
            throw error;
        }
    }

    private mapToFile(row: any) {
        return {
            $id: row.id,
            name: row.name,
            url: row.url,
            type: row.type,
            bucketFileId: row.bucket_file_id,
            accountId: row.account_id,
            owner: row.owner_id,
            extension: row.extension,
            size: Number(row.size),
            users: row.users,
            $createdAt: row.created_at.toISOString(),
            $updatedAt: row.updated_at.toISOString()
        };
    }
}