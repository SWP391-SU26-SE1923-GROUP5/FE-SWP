'use server'

import { IAuthService, CreateAccountProps, SignInProps } from "@/types";
import { AppwriteAuth } from "./providers/appwrite.auth";
import { LocalAuth } from "./providers/local.auth";

const getAuthProvider = (): IAuthService => {
    if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) return new AppwriteAuth();
    return new LocalAuth();
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
export const getUserById = async (id: string | undefined) => getAuthProvider().getUserById(id);
export const getUserFullName = async (id: string | undefined) => getAuthProvider().getUserFullName(id);
export const getUserByEmail = async (email: string) => getAuthProvider().getUserByEmail(email);
export const createAccount = async (props: CreateAccountProps) => getAuthProvider().createAccount(props);
export const signInUser = async (props: SignInProps) => getAuthProvider().signInUser(props);
export const getCurrentUser = async () => getAuthProvider().getCurrentUser();
export const signOutUser = async () => getAuthProvider().signOutUser();
