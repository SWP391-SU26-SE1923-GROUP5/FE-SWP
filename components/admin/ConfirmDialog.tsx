"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
    loading = false,
    onConfirm,
}: ConfirmDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="shad-dialog" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="text-light-100">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="pt-1 text-light-400">{description}</DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="mt-4 flex flex-col gap-3 md:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="modal-cancel-button cursor-pointer rounded-full"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`modal-submit-button cursor-pointer rounded-full ${
                            destructive ? "bg-red text-white hover:bg-red-700" : ""
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" /> Working...
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
