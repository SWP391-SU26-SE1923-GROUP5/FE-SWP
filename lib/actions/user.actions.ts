"use server";

import bcrypt from "bcrypt";
import {createAdminClient, createSessionClient} from "@/lib/appwrite";
import {appwriteConfig} from "@/lib/appwrite/config";
import {Query, ID, Models} from "node-appwrite";
import {parseStringify} from "@/lib/utils";
import {cookies} from "next/headers";
import {avatarPlaceholderUrl} from "@/constants/avatar";
import { auth, signOut } from "@/auth";
import { User } from "@/types"

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

    } catch (error) {
        return null;
    }
}

export const getUserFullName = async (id: string | undefined) => {
    if (!id) return null;
    const owner = await getUserById(id);

    if (!owner) return null;
    return owner.fullName;
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const { databases } = await createAdminClient();

        const result = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            [
                Query.equal("email", [email]),
                Query.limit(1)
            ]
        );

        if (result.total > 0) {
            return parseStringify(result.documents[0]) as User;
        }

        return null;
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
}

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

export const createAccount = async ({
    fullName,
    username,
    email,
    password
}: {
    fullName: string;
    username: string;
    email: string;
    password: string;
}) => {
    const existingUser = await getUserByEmail(email);
    const accountId = ID.unique()

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
            },
        );
    }

    return parseStringify({ accountId });
}

export const signInUser = async ({
    email,
    password
}: {
    email: string,
    password: string
}) => {
    try {
        const existingUser = await getUserByEmail(email);

        if (!existingUser || !existingUser.password_hash) {
            return parseStringify({
                accountId: null,
            })
        }

        const passwordsMatch = await bcrypt.compare(password, existingUser.password_hash);

        if (!passwordsMatch) {
            return parseStringify({
                accountId: null,
            })
        }

        const cookieStore = await cookies();

        cookieStore.set("user-session", existingUser.accountId, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production", // Only require HTTPS in production
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return parseStringify({
            accountId: existingUser.accountId
        });
    } catch(error) {
        handleError(error, "Failed to authenticate user");
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const nextAuthSession = await auth();

        if (nextAuthSession?.user?.email) {
            const existingUser = await getUserByEmail(nextAuthSession.user.email);
            if (existingUser) {
                return parseStringify(existingUser);
            }
        }

        const cookieStore = await cookies();
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
}

export const signOutUser = async () => {
    const cookieStore = await cookies();
    cookieStore.delete("user-session");

    await signOut({ redirectTo: "/" });
}