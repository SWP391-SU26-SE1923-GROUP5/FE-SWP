"use client";

import AuthForm from "@/components/forms/AuthForm";
import { SignInSchema } from "@/lib/validations";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const SignIn = () => {
    const router = useRouter();

    const handleSignIn = async (data: z.infer<typeof SignInSchema>) => {
        try {

            const result = await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            if (result?.error) {
                return {
                    success: false,
                    error: "Invalid email or password.",
                };
            }

            if (result?.ok) {
                router.refresh();
                router.push("/home");
                return { success: true };
            }

            return {
                success: false,
                error: "An unexpected response was received."
            };

        } catch (error: any) {
            console.error("Sign in error:", error);
            return {
                success: false,
                error: "An unexpected error occurred during sign in."
            };
        }
    };

    return (
        <AuthForm
            schema={SignInSchema}
            defaultValues={{
                email: '',
                password: ''
            }}
            onSubmit={handleSignIn}
            formType="SIGN_IN"
        />
    )
}

export default SignIn;