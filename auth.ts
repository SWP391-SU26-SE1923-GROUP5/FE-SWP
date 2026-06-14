import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { getUserByEmail, createAccount } from "@/lib/actions/user.actions";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        })
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) return false;

            try {
                const existingUser = await getUserByEmail(user.email);

                if (!existingUser) {
                    await createAccount({
                        email: user.email,
                        fullName: user.name || "OAuth User",
                        username: user.email.split("@")[0],
                    });
                }

                return true;
            } catch (error) {
                console.error("Error syncing OAuth user:", error);
                return false;
            }
        }
    }
});