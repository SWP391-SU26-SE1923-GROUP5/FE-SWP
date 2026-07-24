import NextAuth, { AuthError } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { signInUser, refreshSessionToken } from "@/lib/actions/user.actions";
import { JWT } from "next-auth/jwt";

declare global {
    var _pendingRefreshRequests: Map<string, Promise<JWT>> | undefined;
}

const pendingRefreshRequests = globalThis._pendingRefreshRequests ?? new Map<string, Promise<JWT>>();

if (process.env.NODE_ENV !== "production") {
    globalThis._pendingRefreshRequests = pendingRefreshRequests;
}

async function refreshAccessToken(token: JWT) {
    const refreshToken = token.refreshToken as string;

    if (pendingRefreshRequests.has(refreshToken)) {
        return await pendingRefreshRequests.get(refreshToken);
    }

    const refreshPromise = (async () => {
        try {
            const refreshedTokens = await refreshSessionToken(
                refreshToken,
                token.accessToken as string
            );

            return {
                ...token,
                accessToken: refreshedTokens.accessToken,
                accessTokenExpiresAt: Date.parse(refreshedTokens.accessTokenExpiresAt),
                refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
                error: undefined,
            };
        } catch (error) {
            return {
                ...token,
                error: "RefreshAccessTokenError",
            };
        } finally {
            setTimeout(() => {
                pendingRefreshRequests.delete(refreshToken);
            }, 10000);
        }
    })();

    pendingRefreshRequests.set(refreshToken, refreshPromise);

    return await refreshPromise;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return { id: "AUTH_ERROR", email: credentials?.email as string, name: "Email and password is required", role: "" };
                }

                try {
                    const result = await signInUser({
                        email: credentials.email as string,
                        password: credentials.password as string
                    });

                    if (!result || !result.user) {
                        return { id: "AUTH_ERROR", email: credentials.email as string, name: "Invalid email or password", role: "" };
                    }

                    return {
                        id: result.user.id,
                        email: result.user.email,
                        name: result.user.fullName,
                        role: result.user.role,
                        currentStorageCapacity: result.user.currentStorageCapacity,
                        tierStorageLimitMb: result.user.tierStorageLimitMb,
                        accessToken: result.accessToken,
                        refreshToken: result.refreshToken,
                    };
                } catch (error: unknown) {
                    const err = error as Error;
                    return { id: "AUTH_ERROR", email: credentials.email as string, name: err.message, role: "" };
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user }) {
            if (user?.id === "AUTH_ERROR") {
                const errMsg = user.name || "";
                if (errMsg.toLowerCase().includes("verify your email")) {
                    return `/verify-otp?email=${encodeURIComponent(user.email || "")}`;
                }
                return `/?error=${encodeURIComponent(errMsg)}`;
            }
            return true;
        },

        async jwt({ token, user, account, trigger }): Promise<JWT> {
            if (user) {
                token.id = user.id as string;
                token.role = user.role as string;
                token.currentStorageCapacity = user.currentStorageCapacity;
                token.tierStorageLimitMb = user.tierStorageLimitMb;
                token.provider = account?.provider ?? "credentials";

                if (token.provider === "credentials") {
                    token.accessToken = user.accessToken;
                    token.refreshToken = user.refreshToken;
                    token.accessTokenExpiresAt = user.accessTokenExpiresAt;
                }
            }

            if (token.provider !== "credentials") {
                return token;
            }

            if (token.error === "RefreshAccessTokenError") {
                return token;
            }

            if (trigger === "update") {
                const rotatedTokens = await refreshAccessToken(token);
                return {
                    ...token,
                    ...rotatedTokens,
                };
            }

            const TIME_NOW = Date.now();
            if (TIME_NOW < (token.accessTokenExpiresAt as number) - 15000) {
                return token;
            }

            const rotatedTokens = await refreshAccessToken(token);
            return {
                ...token,
                ...rotatedTokens,
            };
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.currentStorageCapacity = token.currentStorageCapacity;
                session.user.tierStorageLimitMb = token.tierStorageLimitMb;

                const provider = token.provider || "credentials";
                if (provider === "credentials") {
                    session.accessToken = token.accessToken as string;
                    session.error = token.error as string | undefined;
                    session.accessTokenExpiresAt = token.accessTokenExpiresAt as number;
                }
            }
            return session;
        }
    }
});