"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2, ExternalLink, User, Calendar, HardDrive, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Thumbnail from "@/components/Thumbnail";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import { deleteAdminFile } from "@/lib/actions/admin.actions";
import type { AdminFile } from "@/types/admin";

interface AdminFileDetailClientProps {
    fileId: string;
}

export default function AdminFileDetailClient({ fileId }: AdminFileDetailClientProps) {
    const router = useRouter();
    const [file, setFile] = useState<AdminFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/admin/files/${fileId}`, { signal: controller.signal })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.error || "Failed to load file.");
                setFile(json.data);
            })
            .catch((err) => {
                if (err.name === "AbortError") return;
                setError(err.message || "Failed to load file.");
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [fileId]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAdminFile(fileId);
            toast.success(`File "${file?.name}" has been deleted.`);
            router.push("/admin/files");
        } catch (err: any) {
            toast.error(err?.message || "Could not delete file.");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2 className="size-8 animate-spin text-brand" />
                <p className="text-sm text-light-400">Loading file details...</p>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="space-y-4">
                <Link href="/admin/files" className="inline-flex items-center gap-2 text-xs font-semibold text-light-400 hover:text-brand">
                    <ArrowLeft className="size-3" /> Back to files
                </Link>
                <div className="admin-card">
                    <p className="text-sm text-red">{error || "File not found."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="admin-file-detail">
            <Link href="/admin/files" className="inline-flex items-center gap-2 text-xs font-semibold text-light-400 hover:text-brand transition-colors">
                <ArrowLeft className="size-3" /> Back to files
            </Link>

            <div className="admin-detail-grid">
                <section className="admin-card lg:col-span-1">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Thumbnail
                            type={file.type}
                            extension={file.extension}
                            url={file.url}
                            className="!size-20"
                            imageClassName="!size-12"
                        />
                        <div>
                            <h2 className="text-base font-semibold text-dark-100 line-clamp-2">{file.name}</h2>
                            <p className="text-xs text-light-400 mt-1">.{file.extension}</p>
                        </div>
                        <div className="flex gap-2 w-full">
                            {file.url && (
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button variant="outline" className="w-full rounded-xl text-sm">
                                        <ExternalLink className="size-3.5" /> View
                                    </Button>
                                </a>
                            )}
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl text-sm text-red border-red/30 hover:bg-red/10"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="size-3.5" /> Delete
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="admin-card lg:col-span-2">
                    <h2 className="admin-card-title">File details</h2>
                    <p className="admin-card-subtitle">Metadata and ownership information</p>

                    <dl className="mt-5 space-y-3">
                        <div className="admin-detail-meta-item">
                            <dt className="admin-detail-meta-label">Type</dt>
                            <dd className="flex items-center gap-2">
                                <span className="admin-badge admin-badge-user capitalize">{file.type}</span>
                                <span className="text-xs text-light-400">.{file.extension}</span>
                            </dd>
                        </div>
                        <div className="admin-detail-meta-item">
                            <dt className="admin-detail-meta-label">Size</dt>
                            <dd className="admin-detail-meta-value flex items-center gap-1.5">
                                <HardDrive className="size-3.5 text-light-400" />
                                {convertFileSize(file.size)}
                            </dd>
                        </div>
                        <div className="admin-detail-meta-item">
                            <dt className="admin-detail-meta-label">Owner</dt>
                            <dd className="flex items-center gap-2">
                                <User className="size-3.5 text-light-400" />
                                <div className="text-right">
                                    <span className="font-semibold text-dark-100">{file.ownerName ?? "—"}</span>
                                    {file.ownerEmail && <p className="text-xs text-light-400">{file.ownerEmail}</p>}
                                </div>
                            </dd>
                        </div>
                        <div className="admin-detail-meta-item">
                            <dt className="admin-detail-meta-label">Uploaded</dt>
                            <dd className="admin-detail-meta-value flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-light-400" />
                                {formatDateTime(file.$createdAt)}
                            </dd>
                        </div>
                        <div className="admin-detail-meta-item">
                            <dt className="admin-detail-meta-label">Last Modified</dt>
                            <dd className="admin-detail-meta-value flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-light-400" />
                                {formatDateTime(file.$updatedAt)}
                            </dd>
                        </div>
                        <div className="admin-detail-meta-item">
                            <dt className="admin-detail-meta-label">File ID</dt>
                            <dd className="font-mono text-xs text-dark-100 break-all">{file.$id}</dd>
                        </div>
                        <div className="admin-detail-meta-item">
                            <dt className="admin-detail-meta-label">Owner ID</dt>
                            <dd className="font-mono text-xs text-dark-100 break-all">{file.ownerId}</dd>
                        </div>
                    </dl>
                </section>
            </div>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete this file?"
                description={
                    <>
                        The file <span className="font-semibold text-dark-100">{file.name}</span> will be permanently
                        removed from storage. This cannot be undone.
                    </>
                }
                confirmLabel="Delete file"
                cancelLabel="Keep file"
                destructive
                loading={deleting}
                onConfirm={handleDelete}
            />
        </div>
    );
}
