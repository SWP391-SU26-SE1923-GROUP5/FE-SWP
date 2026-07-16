"use client";

import AuthForm from "@/components/forms/AuthForm";
import { SignInSchema } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signIn } from "next-auth/react";
import ROUTES from "@/constants/routes";

const SignIn = () => {
    const router = useRouter();

    const handleSignIn = async (data: z.infer<typeof SignInSchema>) => {
        try {
            const result = await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
                callbackUrl: ROUTES.HOME
            });

            if (result?.ok && result.url) {
                const url = result.url.replace(window.location.origin, '');

                if (url.includes("verify-otp")) {
                    router.push(url);
                    return { success: true, message: "Please verify your email to continue." };
                }

                const errorMatch = url.match(/[?&]error=([^&]+)/);
                if (errorMatch) {
                    return { success: false, error: decodeURIComponent(errorMatch[1]) };
                }

                router.push(ROUTES.HOME);
                router.refresh();
                return { success: true };
            }

            if (result?.error) {
                return {
                    success: false,
                    error: "Invalid email or password."
                };
            }

            return {
                success: false,
                error: "An unexpected response was received."
            };

        } catch (error: unknown) {
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