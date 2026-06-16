"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserForm from "@/components/admin/UserForm";
import { createAdminUser } from "@/lib/actions/admin.actions";
import type { AdminUser } from "@/types/admin";

interface AdminCreateUserDialogProps {
    onCreated?: (user: AdminUser) => void;
    trigger?: React.ReactNode;
}

export default function AdminCreateUserDialog({ onCreated, trigger }: AdminCreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            const created = await createAdminUser(values);
            toast.success(`Created ${created.fullName}.`);
            setOpen(false);
            onCreated?.(created);
        } catch (error: any) {
            toast.error(error?.message || "Could not create user.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div onClick={() => setOpen(true)}>
                {trigger ?? (
                    <Button className="rounded-full bg-brand text-white hover:bg-brand-100">
                        <Plus className="size-4" /> New user
                    </Button>
                )}
            </div>
            <DialogContent className="shad-dialog sm:max-w-lg" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-light-100">Create new user</DialogTitle>
                    <DialogDescription>
                        Add a new account with a temporary password they can change later.
                    </DialogDescription>
                </DialogHeader>
                <UserForm
                    mode="create"
                    onSubmit={async (data) => {
                        await handleSubmit(data);
                    }}
                    onCancel={() => setOpen(false)}
                />
                {submitting && (
                    <p className="text-center text-xs text-light-400">Creating user, please wait...</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
