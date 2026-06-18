import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import {LocalAuth} from "@/lib/actions/providers/local.auth";
import { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT) {
    try {
        const authService = new LocalAuth();
        const refreshedTokens = await authService.refreshSessionToken(
            token.refreshToken as string,
            token.accessToken as string
        );

        return {
            ...token,
            accessToken: refreshedTokens.accessToken,
            accessTokenExpiresAt: Date.parse(refreshedTokens.accessTokenExpiresAt),
            refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
        };
    } catch (error) {
        console.error("RefreshAccessTokenError", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

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

                const authService = new LocalAuth();

                const result = await authService.signInUser({
                    email: credentials.email as string,
                    password: credentials.password as string
                });

                if (result) {
                    console.log("--- LOGIN DEBUG ---");
                    console.log("Access Token:", result.accessToken);
                    console.log("Refresh Token:", result.refreshToken);
                    console.log("-------------------");
                }

                if (!result || !result.user) {
                    throw new Error("Invalid email or password");
                }

                return {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.fullName,
                    role: result.user.role,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    accessTokenExpiresAt: Date.parse(result.accessTokenExpiresAt),
                };
            }
        })
    ],
    callbacks: {
        async signIn({account}) {
            return true
        },

        async jwt({ token, user, account }): Promise<JWT> {
            if (user) {
                token.id = user.id as string;
                token.role = user.role as string;
                token.provider = account?.provider;

                if (account?.provider === "credentials") {
                    token.accessToken = user.accessToken;
                    token.refreshToken = user.refreshToken;
                    token.accessTokenExpiresAt = user.accessTokenExpiresAt;
                }
            }

            if (token.provider !== "credentials") {
                return token;
            }

            if (token.accessTokenExpiresAt && Date.now() < (token.accessTokenExpiresAt as number) - 60000) {
                return token;
            }

            return await refreshAccessToken(token);
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;

                if (token.provider === "credentials") {
                    session.accessToken = token.accessToken;
                    session.error = token.error;
                }
            }
            return session;
        }
    }
});