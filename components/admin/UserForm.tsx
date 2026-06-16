"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    CreateUserSchema,
    UpdateUserSchema,
    type CreateUserInput,
    type UpdateUserInput,
} from "@/lib/admin/validations";
import { cn } from "@/lib/utils";

type CreateValues = CreateUserInput;
type UpdateValues = UpdateUserInput;

type UserFormValues = CreateValues | UpdateValues;

interface UserFormProps {
    defaultValues?: Partial<UserFormValues>;
    mode: "create" | "edit";
    onSubmit: (data: UserFormValues) => Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
    className?: string;
}

const ROLE_OPTIONS = [
    { value: "user", label: "User", description: "Standard account" },
    { value: "admin", label: "Admin", description: "Full system access" },
] as const;

export default function UserForm({
    defaultValues,
    mode,
    onSubmit,
    onCancel,
    submitLabel,
    className,
}: UserFormProps) {
    const isEdit = mode === "edit";
    const schema = isEdit ? UpdateUserSchema : CreateUserSchema;

    const form = useForm<UserFormValues>({
        resolver: zodResolver(schema as any),
        defaultValues: {
            fullName: defaultValues?.fullName ?? "",
            username: defaultValues?.username ?? "",
            email: defaultValues?.email ?? "",
            role: (defaultValues?.role as "user" | "admin" | undefined) ?? "user",
            password: defaultValues?.password ?? "",
        } as UserFormValues,
    });

    const handleSubmit = form.handleSubmit(async (values) => {
        try {
            await onSubmit(values);
            if (!isEdit) {
                form.reset();
            }
        } catch (error) {
            throw error;
        }
    });

    return (
        <form onSubmit={handleSubmit} className={cn("flex flex-col gap-4", className)} noValidate>
            <div className="admin-form-field">
                <label htmlFor="fullName" className="admin-form-label">Full name</label>
                <Input
                    id="fullName"
                    placeholder="John Doe"
                    aria-invalid={!!form.formState.errors.fullName}
                    {...form.register("fullName")}
                />
                {form.formState.errors.fullName && (
                    <p className="admin-form-error">{form.formState.errors.fullName.message as string}</p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="admin-form-field">
                    <label htmlFor="username" className="admin-form-label">Username</label>
                    <Input
                        id="username"
                        placeholder="johndoe"
                        aria-invalid={!!form.formState.errors.username}
                        {...form.register("username")}
                    />
                    {form.formState.errors.username && (
                        <p className="admin-form-error">{form.formState.errors.username.message as string}</p>
                    )}
                </div>

                <div className="admin-form-field">
                    <label htmlFor="email" className="admin-form-label">Email</label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        aria-invalid={!!form.formState.errors.email}
                        {...form.register("email")}
                    />
                    {form.formState.errors.email && (
                        <p className="admin-form-error">{form.formState.errors.email.message as string}</p>
                    )}
                </div>
            </div>

            <div className="admin-form-field">
                <label htmlFor="password" className="admin-form-label">
                    Password {isEdit && <span className="text-light-400 normal-case">(leave blank to keep current)</span>}
                </label>
                <Input
                    id="password"
                    type="password"
                    placeholder={isEdit ? "••••••••" : "Choose a strong password"}
                    autoComplete={isEdit ? "off" : "new-password"}
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register("password")}
                />
                {form.formState.errors.password && (
                    <p className="admin-form-error">{form.formState.errors.password.message as string}</p>
                )}
                {!isEdit && (
                    <p className="admin-form-hint">
                        Must include uppercase, lowercase, number, and special character.
                    </p>
                )}
            </div>

            <div className="admin-form-field">
                <span className="admin-form-label">Role</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ROLE_OPTIONS.map((option) => {
                        const selected = form.watch("role") === option.value;
                        return (
                            <label
                                key={option.value}
                                className={cn(
                                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                                    selected
                                        ? "border-brand bg-brand/5"
                                        : "border-light-300 bg-white hover:border-brand/40"
                                )}
                            >
                                <input
                                    type="radio"
                                    className="mt-1 size-4 accent-emerald-500"
                                    value={option.value}
                                    {...form.register("role")}
                                />
                                <div>
                                    <p className="text-sm font-semibold text-dark-100">{option.label}</p>
                                    <p className="text-xs text-light-400">{option.description}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>
                {form.formState.errors.role && (
                    <p className="admin-form-error">{form.formState.errors.role.message as string}</p>
                )}
            </div>

            <div className="admin-form-actions">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting} className="rounded-full">
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="rounded-full bg-brand text-white hover:bg-brand-100"
                >
                    {form.formState.isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" /> Saving...
                        </span>
                    ) : (
                        submitLabel ?? (isEdit ? "Save changes" : "Create user")
                    )}
                </Button>
            </div>
        </form>
    );
}
