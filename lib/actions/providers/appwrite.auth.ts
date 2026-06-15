import { IAuthService, CreateAccountProps, SignInProps, User } from "@/types";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
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

        if (!existingUser) {
            const { databases } = await createAdminClient();

            const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

            await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.usersCollectionId,
                accountId,
                {
                    email,
                    avatar: avatarPlaceholderUrl,
                    accountId,
                    password_hash: hashedPassword,
                    fullName,
                    username
                }
            );
        }
        return parseStringify({ accountId });
    }

    async signInUser({ email, password }: SignInProps) {
        const existingUser = await this.getUserByEmail(email);
        if (!existingUser || !existingUser.password_hash || !password) return { accountId: null };

        const passwordsMatch = await bcrypt.compare(password, existingUser.password_hash);
        if (!passwordsMatch) return { accountId: null };

        return parseStringify({ accountId: existingUser.accountId });
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const nextAuthSession = await auth();

            if (nextAuthSession?.user?.email) {
                const existingUser = await this.getUserByEmail(nextAuthSession.user.email);
                if (existingUser) return parseStringify(existingUser);
            }

            return null;
        } catch { return null; }
    }

    async signOutUser() {
        await signOut({ redirectTo: "/sign-in" });
    }
}