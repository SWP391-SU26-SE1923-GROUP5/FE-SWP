"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Thumbnail from "@/components/Thumbnail";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import { deleteAdminFile } from "@/lib/actions/admin.actions";
import type { AdminFile } from "@/types/admin";

interface AdminFileRowProps {
    file: AdminFile;
    onDeleted?: (fileId: string) => void;
}

export default function AdminFileRow({ file, onDeleted }: AdminFileRowProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteAdminFile(file.$id);
            toast.success(`Removed ${file.name}.`);
            setOpen(false);
            onDeleted?.(file.$id);
        } catch (error: any) {
            toast.error(error?.message || "Could not delete file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <tr data-testid="file-row" data-file-id={file.$id}>
                <td>
                    <div className="flex items-center gap-3">
                        <Thumbnail type={file.type} extension={file.extension} url={file.url} className="!size-9" imageClassName="!size-6" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-dark-100">{file.name}</p>
                            <p className="truncate text-xs text-light-400">.{file.extension}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span className="admin-badge admin-badge-user capitalize">{file.type}</span>
                </td>
                <td className="hidden md:table-cell text-sm text-light-100">{convertFileSize(file.size)}</td>
                <td className="hidden lg:table-cell">
                    {file.ownerName ? (
                        <div className="flex items-center gap-2">
                            <Image
                                src="/assets/icons/file-document-light.svg"
                                alt=""
                                width={24}
                                height={24}
                                className="size-6 opacity-60"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm text-dark-100">{file.ownerName}</p>
                                <p className="truncate text-xs text-light-400">{file.ownerEmail}</p>
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-light-400">—</span>
                    )}
                </td>
                <td className="hidden md:table-cell text-xs text-light-400">{formatDateTime(file.$createdAt)}</td>
                <td className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="size-8 rounded-full" aria-label="File actions">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setOpen(true)}
                            >
                                <Trash2 className="size-4" /> Delete file
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </td>
            </tr>

            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete this file?"
                description={
                    <>
                        The file <span className="font-semibold text-dark-100">{file.name}</span> will be removed from
                        storage. This cannot be undone.
                    </>
                }
                confirmLabel="Delete file"
                cancelLabel="Keep file"
                destructive
                loading={loading}
                onConfirm={handleDelete}
            />
        </>
    );
}
