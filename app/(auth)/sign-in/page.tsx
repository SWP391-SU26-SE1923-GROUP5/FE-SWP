"use client";

import AuthForm from "@/components/forms/AuthForm";
import {SignInSchema, SignUpSchema} from "@/lib/validations";
import { signInUser } from "@/lib/actions/user.actions";
import {useRouter} from "next/navigation";
import { z } from "zod";

const SignIn = () => {
    const router = useRouter();

    const handleSignIn = async (data: z.infer<typeof SignInSchema>) => {
        try {
            const result = await signInUser({
                email: data.email,
                password: data.password,
            });

            if (result?.accountId) {
                router.push("/home");
                return { success: true };
            }

            return {
                success: false,
                error: "Invalid email or password.",
            };

        } catch (error: any) {
            console.error("Sign in error:", error);
            return {
                success: false,
                error: error?.message || "An error occurred during sign in."
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
export default SignIn
