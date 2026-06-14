import { IAuthService, CreateAccountProps, SignInProps, User } from "@/types";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "@/constants/avatar";
import { auth, signOut } from "@/auth";
import bcrypt from "bcrypt";

export class AppwriteAuth implements IAuthService {
    async getUserById(id: string | undefined): Promise<User | null> {
        if (!id) return null;
        try {
            const { databases } = await createAdminClient();
            const document = await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.usersCollectionId, id);
            return parseStringify(document) as User;
        } catch { return null; }
    }

    async getUserFullName(id: string | undefined) {
        const user = await this.getUserById(id);
        return user ? user.fullName : null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const { databases } = await createAdminClient();
            const result = await databases.listDocuments(
                appwriteConfig.databaseId, appwriteConfig.usersCollectionId, [Query.equal("email", [email]), Query.limit(1)]
            );
            return result.total > 0 ? (parseStringify(result.documents[0]) as User) : null;
        } catch { return null; }
    }

    async createAccount({ fullName, username, email, password }: CreateAccountProps) {
        const existingUser = await this.getUserByEmail(email);
        const accountId = ID.unique();

        if (!existingUser && password) {
            const { databases } = await createAdminClient();
            const hashedPassword = await bcrypt.hash(password, 12);
            await databases.createDocument(
                appwriteConfig.databaseId, appwriteConfig.usersCollectionId, ID.unique(),
                { email, avatar: avatarPlaceholderUrl, accountId, password_hash: hashedPassword, fullName, username }
            );
        }
        return parseStringify({ accountId });
    }

    async signInUser({ email, password }: SignInProps) {
        const existingUser = await this.getUserByEmail(email);
        if (!existingUser || !existingUser.password_hash || !password) return { accountId: null };

        const passwordsMatch = await bcrypt.compare(password, existingUser.password_hash);
        if (!passwordsMatch) return { accountId: null };

        const cookieStore = await cookies();
        cookieStore.set("user-session", existingUser.accountId, {
            path: "/", httpOnly: true, sameSite: "strict",
            secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7
        });

        return parseStringify({ accountId: existingUser.accountId });
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const nextAuthSession = await auth();
            if (nextAuthSession?.user?.email) {
                const existingUser = await this.getUserByEmail(nextAuthSession.user.email);
                if (existingUser) return parseStringify(existingUser);
            }

            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get("user-session");

            if (sessionCookie?.value) {
                const { databases } = await createAdminClient();
                const user = await databases.listDocuments(
                    appwriteConfig.databaseId, appwriteConfig.usersCollectionId, [Query.equal("accountId", sessionCookie.value)]
                );
                if (user.total > 0) return parseStringify(user.documents[0]);
            }
            return null;
        } catch { return null; }
    }

    async signOutUser() {
        const cookieStore = await cookies();
        cookieStore.delete("user-session");
        await signOut({ redirectTo: "/sign-in" });
    }
}