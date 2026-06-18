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
                fullName: data.name,
                username: data.username,
                email: data.email,
                password: data.password,
            });

            if (result?.email) {
                router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
                return { success: true };
            }

            return { success: false, error: "Failed to create account." };
        } catch (error: unknown) {
            console.error("Sign up error:", error);
            return {
                success: false,
                error: "An unexpected error occurred during sign up."
            };
        }
    };

    return (
        <AuthForm
            schema={SignUpSchema}
            defaultValues={{
                email: "",
                password: "",
                name: "",
                username: "",
            }}
            onSubmit={handleSignUp}
            formType="SIGN_UP"
        />
    );
};

export default SignUp;