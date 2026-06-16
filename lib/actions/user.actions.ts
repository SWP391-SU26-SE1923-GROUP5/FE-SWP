'use server'

import { IAuthService, CreateAccountProps, SignInProps } from "@/types";
import { AppwriteAuth } from "./providers/appwrite.auth";
import { LocalAuth } from "./providers/local.auth";

const getAuthProvider = (): IAuthService => {
    if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) return new AppwriteAuth();
    return new LocalAuth();
};

export const getUserById = async (id: string | undefined) => getAuthProvider().getUserById(id);
export const getUserFullName = async (id: string | undefined) => getAuthProvider().getUserFullName(id);
export const getUserByEmail = async (email: string) => getAuthProvider().getUserByEmail(email);
export const createAccount = async (props: CreateAccountProps) => getAuthProvider().createAccount(props);
export const signInUser = async (props: SignInProps) => getAuthProvider().signInUser(props);
export const getCurrentUser = async () => getAuthProvider().getCurrentUser();
export const signOutUser = async () => getAuthProvider().signOutUser();
