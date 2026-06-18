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
    onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
    formType: "SIGN_IN" | "SIGN_UP";
}

const AuthForm = <T extends FieldValues>({
                                             schema,
                                             defaultValues,
                                             formType,
                                             onSubmit,
                                         }: AuthFormProps<T>) => {
    const form = useForm<T>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema as any),
        defaultValues: defaultValues as DefaultValues<T>,
    });

    const handleSubmit: SubmitHandler<T> = async (data) => {
        try {
            const result = await onSubmit(data);

            if (result.success) {
                if (formType === "SIGN_UP") {
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

                return (
                    <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="paragraph-medium text-dark400_light700">
                            {field === "email" ? "Email Address" : field.charAt(0).toUpperCase() + field.slice(1)}
                        </Label>
                        <Input
                            id={field}
                            {...form.register(fieldName)}
                            type={field === "password" ? "password" : "text"}
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

            <div className="mt-4">
                <p className="text-dark400_light700">
                    {formType === "SIGN_IN" ? (
                        <>
                            Don&#39;t have an account?{" "}
                            <Link href={ROUTES.SIGN_UP} className="paragraph-semibold primary-text-gradient">
                                Sign up
                            </Link>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <Link href={ROUTES.SIGN_IN} className="paragraph-semibold primary-text-gradient">
                                Sign in
                            </Link>
                        </>
                    )}
                </p>
            </div>
        </form>
    );
};

export default AuthForm;