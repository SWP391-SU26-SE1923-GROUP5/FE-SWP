/* eslint-disable no-unused-vars */
import { Models } from "node-appwrite";

export interface User {
    $id: string;
    $createdAt?: string;
    $updatedAt?: string;
    email: string;
    accountId: string;
    fullName: string;
    username: string;
    avatar?: string;
    password_hash?: string;
    files?: any;
    role?: string;
    /** Set to true when the user was authenticated via the hardcoded
     *  frontend admin credentials (lib/admin/credentials.ts).  Used by
     *  the sign-in page to decide whether to redirect to /admin. */
    isHardcodedAdmin?: boolean;
}

export interface CreateAccountProps {
    fullName: string;
    username: string;
    email: string;
    password: string;
}

export interface SignInProps {
    email: string;
    password: string;
}

export interface UpdateEditedFileProps {
    fileId: string;
    oldBucketFileId: string;
    file: File;
    path: string;
}

export interface IAuthService {
    getUserById(id: string | undefined): Promise<User | null>;
    getUserFullName(id: string | undefined): Promise<string | null>;
    getUserByEmail(email: string): Promise<User | null>;
    createAccount(props: CreateAccountProps): Promise<{ accountId: string | null }>;
    signInUser(props: SignInProps): Promise<{ accountId: string | null }>;
    getCurrentUser(): Promise<User | null>;
    signOutUser(): Promise<void>;
}

export interface IFileStorage {
    uploadFile(props: UploadFileProps): Promise<File_ | { status: string }>;
    getFiles(props: GetFilesProps): Promise<{ documents: File_[]; total: number }>;
    renameFile(props: RenameFileProps): Promise<File_>;
    updateFileUsers(props: UpdateFileUsersProps): Promise<File_>;
    updateEditedFile(props: UpdateEditedFileProps): Promise<File_>;
    deleteFile(props: DeleteFileProps): Promise<{ status: string }>;
    getTotalSpaceUsed(): Promise<any>;
    getFileBuffer(bucketFileId: string): Promise<Buffer>;
}

interface File_ {
    $id: string;
    $createdAt?: string;
    $updatedAt?: string;
    name: string;
    url: string;
    type: FileType;
    bucketFileId: string;
    accountId: string;
    owner?: string;
    extension: string;
    size: number;
    users: string[]
}

declare type FileType = "document" | "image" | "video" | "audio" | "other";

declare interface ActionType {
    label: string;
    icon: string;
    value: string;
}

declare interface SearchParamProps {
    params?: Promise<SegmentParams>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

declare interface UploadFileProps {
    file: File;
    ownerId: string;
    accountId: string;
    path: string;
}
declare interface GetFilesProps {
    types: FileType[];
    searchText?: string;
    sort?: string;
    limit?: number;
}
declare interface RenameFileProps {
    fileId: string;
    name: string;
    extension: string;
    path: string;
}
declare interface UpdateFileUsersProps {
    fileId: string;
    emails: string[];
    path: string;
}
declare interface DeleteFileProps {
    fileId: string;
    bucketFileId: string;
    path: string;
}

declare interface FileUploaderProps {
    ownerId: string;
    accountId: string;
    className?: string;
}

declare interface MobileNavigationProps {
    ownerId: string;
    accountId: string;
    fullName: string;
    avatar: string;
    email: string;
}
declare interface SidebarProps {
    fullName: string;
    avatar: string;
    email: string;
}

declare interface ThumbnailProps {
    type: string;
    extension: string;
    url: string;
    className?: string;
    imageClassName?: string;
}

declare interface ShareInputProps {
    file: File_;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (email: string) => void;
}

declare type SegmentParams = { [key: string]: string | string[] | undefined };