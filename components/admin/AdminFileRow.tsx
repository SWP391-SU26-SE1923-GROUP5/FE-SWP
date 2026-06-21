"use client";

import { useState } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Thumbnail from "@/components/Thumbnail";
import { formatDateTime } from "@/lib/utils";
import { banAdminDocument, unbanAdminDocument } from "@/lib/actions/admin.actions";
import type { AdminFile } from "@/types/admin";

interface AdminFileRowProps {
    file: AdminFile;
    onModerationChange?: (file: AdminFile, banned: boolean) => void;
}

export default function AdminFileRow({ file, onModerationChange }: AdminFileRowProps) {
    const fileId = file.id ?? file.$id ?? "";
    const name = file.title ?? file.name ?? "Untitled";
    const extension = file.fileExtension ?? file.extension ?? "file";
    const url = file.fileLink ?? file.url ?? undefined;
    const type = file.type ?? "document";
    const createdAt = file.createdAt;
    const isBanned =
        (typeof file.status === "string" && file.status.toLowerCase() === "banned") ||
        (typeof file.status === "string" && file.status.toLowerCase() === "removed");

    const [banOpen, setBanOpen] = useState(false);
    const [unbanOpen, setUnbanOpen] = useState(false);
    const [working, setWorking] = useState(false);

    const handleBan = async () => {
        setWorking(true);
        try {
            await banAdminDocument(fileId);
            toast.success(`Banned ${name}.`);
            setBanOpen(false);
            onModerationChange?.({...file, status: "Banned"}, true);
        } catch (error: any) {
            toast.error(error?.message || "Could not ban document.");
        } finally {
            setWorking(false);
        }
    };

    const handleUnban = async () => {
        setWorking(true);
        try {
            await unbanAdminDocument(fileId);
            toast.success(`Reinstated ${name}.`);
            setUnbanOpen(false);
            onModerationChange?.({...file, status: "Published"}, false);
        } catch (error: any) {
            toast.error(error?.message || "Could not reinstate document.");
        } finally {
            setWorking(false);
        }
    };

    return (
        <>
            <tr data-testid="file-row" data-file-id={fileId}>
                <td>
                    <div className="flex items-center gap-3">
                        <Thumbnail
                            type={type}
                            extension={extension}
                            url={url}
                            className="!size-9"
                            imageClassName="!size-6"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-dark-100">{name}</p>
                            <p className="truncate text-xs text-light-400">
                                {extension ? `.${extension}` : "—"}
                            </p>
                        </div>
                    </div>
                </td>
                <td>
                    <span className="admin-badge admin-badge-user capitalize">{type}</span>
                </td>
                <td className="hidden md:table-cell text-sm text-light-100">
                    {typeof file.ownerName === "string" ? file.ownerName : "—"}
                </td>
                <td className="hidden md:table-cell text-xs text-light-400">
                    {createdAt ? formatDateTime(createdAt) : "—"}
                </td>
                <td className="text-right">
                    {isBanned ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnbanOpen(true)}
                            className="rounded-full"
                        >
                            <ShieldCheck className="size-4" /> Reinstate
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setBanOpen(true)}
                            className="rounded-full"
                        >
                            <ShieldOff className="size-4" /> Ban
                        </Button>
                    )}
                </td>
            </tr>

            <ConfirmDialog
                open={banOpen}
                onOpenChange={setBanOpen}
                title="Ban this document?"
                description={
                    <>
                        The document <span className="font-semibold text-dark-100">{name}</span> will be marked as
                        <code className="mx-1 rounded bg-light-300 px-1">Banned</code>
                        via the AIStudyHub API.
                    </>
                }
                confirmLabel="Ban document"
                cancelLabel="Cancel"
                destructive
                loading={working}
                onConfirm={handleBan}
            />

            <ConfirmDialog
                open={unbanOpen}
                onOpenChange={setUnbanOpen}
                title="Reinstate this document?"
                description={
                    <>
                        The document <span className="font-semibold text-dark-100">{name}</span> will be marked as
                        <code className="mx-1 rounded bg-light-300 px-1">Published</code>
                        and become available again.
                    </>
                }
                confirmLabel="Reinstate"
                cancelLabel="Cancel"
                loading={working}
                onConfirm={handleUnban}
            />
        </>
    );
}
