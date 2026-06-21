"use server";

import bcrypt from "bcrypt";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import { auth, signOut } from "@/auth";
import { User } from "@/types";
import { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL } from "@/lib/admin/credentials";

/** Cookie set when the user authenticates with the hardcoded admin credentials. */
const ADMIN_SESSION_COOKIE = "admin-session";

/** Build the static fake admin user returned on a successful admin sign-in. */
const buildHardcodedAdminUser = (): User => ({
    $id: "00000000-0000-0000-0000-000000000001",
    accountId: "00000000-0000-0000-0000-000000000001",
    email: ADMIN_EMAIL,
    fullName: "Administrator",
    username: ADMIN_USERNAME,
    avatar: avatarPlaceholderUrl,
    role: "admin",
    isHardcodedAdmin: true,
});

/** Returns true when `email` / `password` match the hardcoded admin. */
const isHardcodedAdmin = (email: string, password: string): boolean => {
    if (password !== ADMIN_PASSWORD) return false;
    const normalized = email.trim().toLowerCase();
    return (
        normalized === ADMIN_EMAIL.toLowerCase() ||
        normalized === ADMIN_USERNAME.toLowerCase()
    );
};

export const getUserById = async (id: string | undefined): Promise<User | null> => {
    if (!id) return null;
    try {
        const { databases } = await createAdminClient();
        const document = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            id
        );
        return parseStringify(document) as User;
    } catch {
        return null;
    }
};

export const getUserFullName = async (id: string | undefined) => {
    if (!id) return null;
    const owner = await getUserById(id);
    return owner ? owner.fullName : null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const { databases } = await createAdminClient();
        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            [Query.equal("email", [email]), Query.limit(1)]
        );
        return result.total > 0 ? (parseStringify(result.documents[0]) as User) : null;
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
};

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

export const createAccount = async ({
    fullName,
    username,
    email,
    password,
}: {
    fullName: string;
    username: string;
    email: string;
    password: string;
}) => {
    const existingUser = await getUserByEmail(email);
    const accountId = ID.unique();

    if (!existingUser) {
        const { databases } = await createAdminClient();
        const hashedPassword = await bcrypt.hash(password, 12);
        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                email,
                avatar: avatarPlaceholderUrl,
                accountId,
                password_hash: hashedPassword,
                fullName,
                username,
            }
        );
    }

    return parseStringify({ accountId });
};

export const signInUser = async ({
    email,
    password,
}: {
    email: string;
    password: string;
}): Promise<{ accountId: string | null; isHardcodedAdmin?: boolean }> => {
    // ── Hardcoded admin credentials ─────────────────────────────────────────
    if (isHardcodedAdmin(email, password)) {
        try {
            const cookieStore = await cookies();
            cookieStore.set(ADMIN_SESSION_COOKIE, "true", {
                path: "/",
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 7,
            });
        } catch {
            // Non-fatal: user is still authenticated without the cookie flag.
        }
        return parseStringify({
            accountId: "00000000-0000-0000-0000-000000000001",
            isHardcodedAdmin: true,
        });
    }

    // ── Regular user — Appwrite ──────────────────────────────────────────────
    try {
        const existingUser = await getUserByEmail(email);

        if (!existingUser || !existingUser.password_hash) {
            return parseStringify({ accountId: null });
        }

        const passwordsMatch = await bcrypt.compare(password, existingUser.password_hash);

        if (!passwordsMatch) {
            return parseStringify({ accountId: null });
        }

        const cookieStore = await cookies();
        cookieStore.set("user-session", existingUser.accountId, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
        });

        return parseStringify({ accountId: existingUser.accountId });
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const cookieStore = await cookies();

        // ── Hardcoded admin ──────────────────────────────────────────────────
        if (cookieStore.get(ADMIN_SESSION_COOKIE)?.value === "true") {
            return buildHardcodedAdminUser();
        }

        // ── NextAuth session ─────────────────────────────────────────────────
        const nextAuthSession = await auth();
        if (nextAuthSession?.user?.email) {
            const existingUser = await getUserByEmail(nextAuthSession.user.email);
            if (existingUser) return parseStringify(existingUser);
        }

        // ── Appwrite user-session cookie ─────────────────────────────────────
        const sessionCookie = cookieStore.get("user-session");
        if (sessionCookie && sessionCookie.value) {
            const accountId = sessionCookie.value;
            const { databases } = await createAdminClient();
            const user = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.usersCollectionId,
                [Query.equal("accountId", accountId)]
            );
            if (user.total > 0) {
                return parseStringify(user.documents[0]);
            }
        }

        return null;
    } catch (error) {
        console.error("Failed to get current user:", error);
        return null;
    }
};

export const signOutUser = async () => {
    const cookieStore = await cookies();
    cookieStore.delete("user-session");
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    await signOut({ redirectTo: "/sign-in" });
};
