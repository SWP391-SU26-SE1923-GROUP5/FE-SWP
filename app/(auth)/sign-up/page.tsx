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
                password: data.password,
                dateOfBirth: data.dateOfBirth
            });

            if (result?.email) {
                router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
                return { success: true };
            }

            return { success: false, error: "Failed to create account." };
        } catch (error: unknown) {
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
                fullName: "",
                email: "",
                password: "",
                dateOfBirth: "",
            }}
            onSubmit={handleSignUp}
            formType="SIGN_UP"
        />
    );
};

export default SignUp;