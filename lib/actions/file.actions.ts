'use server'
import { IFileStorage, DeleteFileProps, GetFilesProps, RenameFileProps, UpdateFileUsersProps, UploadFileProps, UpdateEditedFileProps } from "@/types";
import { AppwriteStorage } from "./providers/appwrite.storage";
import { LocalStorage } from "./providers/local.storage";

const getStorageProvider = (): IFileStorage => process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? new AppwriteStorage() : new LocalStorage();

export const uploadFile = async (props: UploadFileProps) => getStorageProvider().uploadFile(props);
export const getFiles = async (props: GetFilesProps) => getStorageProvider().getFiles(props);
export const renameFile = async (props: RenameFileProps) => getStorageProvider().renameFile(props);
export const updateFileUsers = async (props: UpdateFileUsersProps) => getStorageProvider().updateFileUsers(props);
export const updateEditedFile = async (props: UpdateEditedFileProps) => getStorageProvider().updateEditedFile(props);
export const deleteFile = async (props: DeleteFileProps) => getStorageProvider().deleteFile(props);
export const getTotalSpaceUsed = async () => getStorageProvider().getTotalSpaceUsed();
export const getFileBuffer = async (bucketFileId: string) => getStorageProvider().getFileBuffer(bucketFileId);