import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [GitHub, Google],
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) return false;

            try {
                const { databases } = await createAdminClient();

                const existingUsers = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.usersCollectionId,
                    [Query.equal("email", user.email)]
                );

                if (existingUsers.total === 0) {
                    await databases.createDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.usersCollectionId,
                        ID.unique(),
                        {
                            email: user.email,
                            fullName: user.name || "OAuth User",
                            username: user.email.split("@")[0],
                            accountId: account?.providerAccountId || ID.unique(),
                            avatar: user.image || undefined,
                        }
                    );
                }

                return true;
            } catch (error) {
                console.error("Error syncing OAuth user to Appwrite:", error);
                return false;
            }
        }
    }
});