"use client"

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Subject, CreateSubjectDto, UpdateSubjectDto } from "@/types"
import { createSubject, updateSubject } from "@/lib/actions/subject.actions"
import { toast } from "sonner"
import { BookOpen, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { SubjectSchema } from "@/lib/validations"

interface SubjectDialogProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    subject?: Subject | null;
    onSuccess?: () => void;
}

type SubjectFormValues = z.infer<typeof SubjectSchema>;

const SubjectDialog = ({ isOpen, setIsOpen, subject, onSuccess }: SubjectDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors }
    } = useForm<SubjectFormValues>({
        resolver: zodResolver(SubjectSchema),
        defaultValues: {
            subjectCode: "",
            subjectName: "",
            description: ""
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (subject) {
                reset({
                    subjectCode: subject.subjectCode || '',
                    subjectName: subject.subjectName || '',
                    description: subject.description || ''
                });
            } else {
                reset({ subjectCode: '', subjectName: '', description: '' });
            }
        }
    }, [isOpen, subject, reset]);

    const onSubmit = async (data: SubjectFormValues) => {
        setIsLoading(true);
        try {
            if (subject) {
                await updateSubject({
                    id: subject.id,
                    ...data
                } as UpdateSubjectDto);
                toast.success("Subject updated successfully!");
            } else {
                await createSubject(data as CreateSubjectDto);
                toast.success("Subject created successfully!");
            }
            
            setIsOpen(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            if (error.message?.includes("409") || error.message?.toLowerCase().includes("already exists") || error.message?.includes("Conflict")) {
                setError("subjectCode", { type: "manual", message: `Subject code '${data.subjectCode}' already exists.` });
            } else {
                toast.error(error.message || "Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && setIsOpen(open)}>
            <DialogContent className="sm:max-w-[425px] p-6 rounded-3xl bg-white dark:bg-dark-200 border border-light-800 dark:border-dark-400 shadow-2xl">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-xl font-bold text-dark100_light900 flex items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <BookOpen className="h-5 w-5" />
                        </span>
                        {subject ? "Edit Subject" : "Create New Subject"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-dark500_light400">
                        {subject 
                            ? "Update the details for your study subject below." 
                            : "Add a new subject to better organize your study materials."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="subjectCode" className={`text-sm font-semibold ${errors.subjectCode ? 'text-destructive' : 'text-dark300_light700'}`}>
                            Subject Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="subjectCode"
                            placeholder="e.g. CS101"
                            disabled={isLoading}
                            className={`bg-light-900 dark:bg-dark-300 border-light-800 dark:border-dark-400 focus-visible:ring-emerald-500 ${errors.subjectCode ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            {...register("subjectCode")}
                        />
                        {errors.subjectCode && (
                            <p className="text-xs font-medium text-destructive mt-1">{errors.subjectCode.message}</p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="subjectName" className={`text-sm font-semibold ${errors.subjectName ? 'text-destructive' : 'text-dark300_light700'}`}>
                            Subject Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="subjectName"
                            placeholder="e.g. Introduction to Computer Science"
                            disabled={isLoading}
                            className={`bg-light-900 dark:bg-dark-300 border-light-800 dark:border-dark-400 focus-visible:ring-emerald-500 ${errors.subjectName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            {...register("subjectName")}
                        />
                        {errors.subjectName && (
                            <p className="text-xs font-medium text-destructive mt-1">{errors.subjectName.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className={`text-sm font-semibold ${errors.description ? 'text-destructive' : 'text-dark300_light700'}`}>
                            Description
                        </Label>
                        <Input
                            id="description"
                            placeholder="Optional subject description"
                            disabled={isLoading}
                            className={`bg-light-900 dark:bg-dark-300 border-light-800 dark:border-dark-400 focus-visible:ring-emerald-500 ${errors.description ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-destructive mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-4 border-t border-light-800 dark:border-dark-400">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                            className="rounded-full font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Subject"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default SubjectDialog

