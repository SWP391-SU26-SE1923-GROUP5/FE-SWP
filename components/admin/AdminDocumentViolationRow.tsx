"use client";

import { useState } from "react";
import { Eye, MoreHorizontal, ShieldOff, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DocumentStatusBadge, { type DocumentModerationStatus } from "@/components/admin/DocumentStatusBadge";
import DocumentOwnerCard from "@/components/admin/DocumentOwnerCard";
import Thumbnail from "@/components/Thumbnail";
import { formatDateTime } from "@/lib/utils";
import { banAdminDocument, unbanAdminDocument } from "@/lib/actions/admin.actions";
import type { AdminFile } from "@/types/admin";

interface AdminDocumentViolationRowProps {
    file: AdminFile;
    status?: DocumentModerationStatus;
    reportCount?: number;
    onModerationChange?: (file: AdminFile, banned: boolean) => void;
}

export default function AdminDocumentViolationRow({
    file,
    status,
    reportCount = 0,
    onModerationChange,
}: AdminDocumentViolationRowProps) {
    const fileId = file.id ?? file.$id ?? "";
    const name = file.title ?? file.name ?? "Untitled";
    const extension = file.fileExtension ?? file.extension ?? "file";
    const url = file.fileLink ?? file.url ?? undefined;
    const type = file.type ?? "document";
    const createdAt = file.createdAt;
    const computedStatus: DocumentModerationStatus =
        status ?? (typeof file.status === "string" && file.status.toLowerCase() === "banned" ? "removed" : "active");

    const [detailsOpen, setDetailsOpen] = useState(false);
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

    const isBanned = computedStatus === "removed";

    return (
        <>
            <tr data-testid="document-violation-row" data-file-id={fileId}>
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
                    <DocumentStatusBadge status={computedStatus} />
                </td>
                <td>
                    <span className="admin-badge admin-badge-user capitalize">{type}</span>
                </td>
                <td className="hidden md:table-cell text-sm text-light-100">
                    {typeof file.ownerName === "string" ? file.ownerName : "—"}
                </td>
                <td className="hidden lg:table-cell text-sm text-light-100">
                    {typeof reportCount === "number" ? (
                        <span className="font-semibold text-dark-100">{reportCount}</span>
                    ) : (
                        "—"
                    )}
                </td>
                <td className="hidden md:table-cell text-xs text-light-400">
                    {createdAt ? formatDateTime(createdAt) : "—"}
                </td>
                <td className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8 rounded-full"
                                aria-label="Document actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
                                <Eye className="size-4 text-light-100" /> View details
                            </DropdownMenuItem>
                            {url && (
                                <DropdownMenuItem asChild>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="size-4 text-light-100" /> Open file
                                    </a>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {isBanned ? (
                                <DropdownMenuItem onSelect={() => setUnbanOpen(true)}>
                                    <ShieldCheck className="size-4 text-light-100" /> Reinstate document
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => setBanOpen(true)}
                                >
                                    <ShieldOff className="size-4" /> Ban document
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </td>
            </tr>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="shad-dialog sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="text-light-100">Document details</DialogTitle>
                        <DialogDescription>Owner information and moderation actions.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DocumentOwnerCard
                            ownerId={file.ownerId ?? file.userId}
                            ownerName={file.ownerName}
                            ownerEmail={file.ownerEmail}
                            fileCount={undefined}
                            joinedAt={undefined}
                        />
                        <div className="admin-card">
                            <h3 className="admin-card-title">Document</h3>
                            <p className="admin-card-subtitle">{name}</p>
                            <dl className="mt-3 space-y-2 text-sm">
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Type</dt>
                                    <dd className="capitalize text-dark-100">{type}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Status</dt>
                                    <dd><DocumentStatusBadge status={computedStatus} /></dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Uploaded</dt>
                                    <dd className="text-dark-100">
                                        {createdAt ? formatDateTime(createdAt) : "—"}
                                    </dd>
                                </div>
                                {file.voteCount !== undefined && (
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-light-400">Votes</dt>
                                        <dd className="text-dark-100">{file.voteCount}</dd>
                                    </div>
                                )}
                            </dl>
                            <div className="mt-4 flex gap-2">
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
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={banOpen}
                onOpenChange={setBanOpen}
                title="Ban this document?"
                description={
                    <>
                        The document <span className="font-semibold text-dark-100">{name}</span> will be marked as
                        <code className="mx-1 rounded bg-light-300 px-1">Banned</code>
                        via the AIStudyHub API. Other users will no longer be able to access it.
                    </>
                }
                confirmLabel="Ban document"
                cancelLabel="Keep document"
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
                        and become available again to other users.
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
