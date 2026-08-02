"use client";

import { SignUpSchema } from "@/lib/validations";
import AuthForm from "@/components/forms/AuthForm";
import { createAccount } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";
import { z } from "zod";

const SignUp = () => {
    const router = useRouter();

    const handleSignUp = async (data: z.infer<typeof SignUpSchema>) => {
        try {
            const result = await createAccount({
                fullName: data.fullName,
                email: data.email,
                password: data.password
            });

            if (result?.email) {
                router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
                return { success: true };
            }

            return { success: false, error: "Failed to create account." };
        } catch (error: unknown) {
            const rawMessage = error instanceof Error ? error.message : String(error);
            const cleanMessage = rawMessage.replace(/^\[\d+\]\s*/, '');

            if (
                cleanMessage.toLowerCase().includes("already registered") ||
                cleanMessage.toLowerCase().includes("already exists")
            ) {
                return {
                    success: false,
                    error: "Email is already registered. Please sign in instead."
                };
            }

            return {
                success: false,
                error: cleanMessage || "An unexpected error occurred during sign up."
            };
        }
    };

    return (
        <AuthForm
            schema={SignUpSchema}
            defaultValues={{
                fullName: "",
                email: "",
                password: "",
                confirmPassword: "",
            }}
            onSubmit={handleSignUp}
            formType="SIGN_UP"
        />
    );
};

export default SignUp;