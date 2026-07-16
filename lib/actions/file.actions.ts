'use server'

import { IFileStorage } from "@/types";
import { LocalStorage } from "./providers/local.storage";

const getStorageProvider = (): IFileStorage => {
    return new LocalStorage();
};

const storageProvider = getStorageProvider();

export const getSubjects = storageProvider.getSubjects.bind(storageProvider);
export const uploadFile = storageProvider.uploadFile.bind(storageProvider);
export const getFiles = storageProvider.getFiles.bind(storageProvider);
export const renameFile = storageProvider.renameFile.bind(storageProvider);
export const updateFileUsers = storageProvider.updateFileUsers.bind(storageProvider);
export const getDocumentShares = storageProvider.getDocumentShares.bind(storageProvider);
export const revokeDocumentShare = storageProvider.revokeDocumentShare.bind(storageProvider);
export const updateEditedFile = storageProvider.updateEditedFile.bind(storageProvider);
export const deleteFile = storageProvider.deleteFile.bind(storageProvider);
export const getTotalSpaceUsed = storageProvider.getTotalSpaceUsed.bind(storageProvider);
export const downloadFile = storageProvider.downloadFile.bind(storageProvider);
export const previewFile = storageProvider.previewFile.bind(storageProvider);
export const getFileStatus = storageProvider.getFileStatus.bind(storageProvider);
export const reprocessFile = storageProvider.reprocessFile.bind(storageProvider);
export const getTrashFiles = storageProvider.getTrashFiles.bind(storageProvider);
export const restoreFile = storageProvider.restoreFile.bind(storageProvider);
export const permanentDeleteFile = storageProvider.permanentDeleteFile.bind(storageProvider);