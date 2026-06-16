import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import {AppwriteAuth} from "@/lib/actions/providers/appwrite.auth";

export const {handlers, signIn, signOut, auth} = NextAuth({
    pages: {
        signIn: "/sign-in",
    },
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: {label: "Email", type: "email"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password is required");
                }

                const authService = new AppwriteAuth();

                const result = await authService.signInUser({
                    email: credentials.email as string,
                    password: credentials.password as string
                });

                if (!result || !result.accountId) {
                    throw new Error("Invalid email or password");
                }

                const user = await authService.getUserByEmail(credentials.email as string);

                if (!user) {
                    throw new Error("User profile not found");
                }

                return {
                    id: user.$id,
                    email: user.email,
                    name: user.fullName,
                    role: user.role,
                };
            }
        })
    ],
    callbacks: {
        async signIn({user, account}) {
            if (!user.email) return false;
            if (account?.provider === "credentials") {
                return true;
            }

            try {
                const authService = new AppwriteAuth();
                const existingUser = await authService.getUserByEmail(user.email);

                if (!existingUser) {
                    await authService.createAccount({
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
        },

        async jwt({token, user}) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },

        async session({session, token}) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        }
    }
});