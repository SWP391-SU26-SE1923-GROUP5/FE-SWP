"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { DefaultValues, FieldValues, Path, SubmitHandler, useForm } from "react-hook-form";
import { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ROUTES from "@/constants/routes";
import { toast } from "sonner";

interface AuthFormProps<T extends FieldValues> {
    schema: ZodType<T>;
    defaultValues: DefaultValues<T>;
    onSubmit: (data: T) => Promise<{ success: boolean; error?: string; message?: string }>;
    formType: "SIGN_IN" | "SIGN_UP";
}

export function formatLabel(key: string) {
    if (key === "email") return "Email Address";
    if (key === "dateOfBirth") return "Date Of Birth";
    const withSpaces = key.replace(/([A-Z])/g, ' $1');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).trim();
}

const AuthForm = <T extends FieldValues>({
                                             schema,
                                             defaultValues,
                                             formType,
                                             onSubmit,
                                         }: AuthFormProps<T>) => {
    const form = useForm<T>({
        resolver: zodResolver(schema as any),
        defaultValues: defaultValues as DefaultValues<T>,
    });

    const handleSubmit: SubmitHandler<T> = async (data) => {
        try {
            const result = await onSubmit(data);

            if (result.success) {
                if (result.message) {
                    toast.success(result.message);
                } else if (formType === "SIGN_UP") {
                    toast.success("Account created! Redirecting to verification...");
                } else {
                    toast.success("Signed in successfully!");
                }
            } else {
                toast.error(result.error || "Authentication failed. Please try again.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please check your connection.");
        }
    };

    const buttonText = formType === "SIGN_IN" ? "Sign In" : "Sign Up";

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-10 space-y-6">
            {Object.keys(defaultValues).map((field) => {
                const fieldName = field as Path<T>;
                const error = form.formState.errors[fieldName];
                const labelText = formatLabel(field);

                const inputType =
                    field === "password" ? "password" :
                        field === "dateOfBirth" ? "date" :
                            "text";

                return (
                    <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="paragraph-medium text-dark400_light700">
                            {labelText}
                        </Label>
                        <Input
                            id={field}
                            {...form.register(fieldName)}
                            type={inputType}
                            className="paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus min-h-12 rounded-1.5 border"
                        />
                        {error && (
                            <p className="text-sm font-medium text-destructive">
                                {error.message as string}
                            </p>
                        )}
                    </div>
                );
            })}

            <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="primary-gradient paragraph-medium min-h-12 w-full rounded-2 px-4 py-3 font-inter !text-light-900 cursor-pointer"
            >
                {form.formState.isSubmitting
                    ? formType === "SIGN_IN" ? "Signing In..." : "Signing Up..."
                    : buttonText}
            </Button>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-dark400_light700">
                {formType === "SIGN_IN" ? (
                    <>
                        <p>
                            Don&#39;t have an account?{" "}
                            <Link href={ROUTES.SIGN_UP} className="paragraph-semibold primary-text-gradient">
                                Sign up
                            </Link>
                        </p>
                        <Link
                            href="/forgot-password"
                            className="paragraph-semibold primary-text-gradient hover:underline ml-auto"
                        >
                            Forgot password?
                        </Link>
                    </>
                ) : (
                    <p>
                        Already have an account?{" "}
                        <Link href={ROUTES.SIGN_IN} className="paragraph-semibold primary-text-gradient">
                            Sign in
                        </Link>
                    </p>
                )}
            </div>
        </form>
    );
};

export default AuthForm;