"use client";

import AuthForm from "@/components/forms/AuthForm";
import {SignInSchema} from "@/lib/validations";
import {useRouter} from "next/navigation";
import {z} from "zod";
import {signIn} from "next-auth/react";
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

            console.log("NEXT_AUTH_RESULT:", result);

            if (result?.error) {
                return {
                    success: false,
                    error: "Invalid email or password.",
                };
            }

            if (result?.ok) {
                router.push(ROUTES.HOME);
                router.refresh();
                return {success: true};
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