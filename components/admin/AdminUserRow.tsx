"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import UserForm from "@/components/admin/UserForm";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import { convertFileSize, formatDateTime } from "@/lib/utils";
import { deleteAdminUser, updateAdminUser } from "@/lib/actions/admin.actions";
import type { AdminUser } from "@/types/admin";

interface AdminUserRowProps {
    user: AdminUser;
    isSelf?: boolean;
    onUpdated?: (user: AdminUser) => void;
    onDeleted?: (userId: string) => void;
}

export default function AdminUserRow({ user, isSelf = false, onUpdated, onDeleted }: AdminUserRowProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleUpdate = async (data: any) => {
        setSubmitting(true);
        try {
            const updated = await updateAdminUser(user.$id, data);
            toast.success(`Updated ${updated.fullName}.`);
            setEditOpen(false);
            onUpdated?.(updated);
        } catch (error: any) {
            toast.error(error?.message || "Could not update user.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            await deleteAdminUser(user.$id);
            toast.success(`Removed ${user.fullName}.`);
            setDeleteOpen(false);
            onDeleted?.(user.$id);
        } catch (error: any) {
            toast.error(error?.message || "Could not delete user.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <tr data-testid="user-row" data-user-id={user.$id}>
                <td>
                    <div className="flex items-center gap-3">
                        <Image
                            src={user.avatar || avatarPlaceholderUrl}
                            alt={user.fullName}
                            width={40}
                            height={40}
                            unoptimized
                            className="size-10 rounded-full object-cover ring-1 ring-light-300"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-dark-100">{user.fullName}</p>
                            <p className="truncate text-xs text-light-400">@{user.username}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <p className="truncate text-sm text-dark-100">{user.email}</p>
                </td>
                <td>
                    <span
                        className={`admin-badge ${
                            user.role === "admin" ? "admin-badge-admin" : "admin-badge-user"
                        }`}
                    >
                        {user.role === "admin" ? "Admin" : "User"}
                    </span>
                </td>
                <td className="hidden md:table-cell text-sm text-light-100">
                    {typeof user.filesCount === "number" ? user.filesCount : "—"}
                </td>
                <td className="hidden lg:table-cell text-sm text-light-100">
                    {typeof user.totalStorage === "number" ? convertFileSize(user.totalStorage) : "—"}
                </td>
                <td className="hidden md:table-cell text-xs text-light-400">
                    {user.createdAt ? formatDateTime(user.createdAt) : "—"}
                </td>
                <td className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-8 rounded-full"
                                aria-label="User actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                                <Pencil className="size-4 text-light-100" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                disabled={isSelf}
                                onSelect={() => {
                                    if (!isSelf) setDeleteOpen(true);
                                }}
                            >
                                <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </td>
            </tr>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="shad-dialog sm:max-w-lg" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="text-light-100">Edit user</DialogTitle>
                        <DialogDescription>Update profile information and role for {user.fullName}.</DialogDescription>
                    </DialogHeader>
                    <UserForm
                        mode="edit"
                        defaultValues={{
                            fullName: user.fullName,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                        }}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete this user?"
                description={
                    <>
                        This will permanently remove <span className="font-semibold text-dark-100">{user.fullName}</span>{" "}
                        and all of their uploaded files. This action cannot be undone.
                    </>
                }
                confirmLabel="Delete user"
                cancelLabel="Keep user"
                destructive
                loading={submitting}
                onConfirm={handleDelete}
            />
        </>
    );
}
