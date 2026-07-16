'use server'

import {IAuthService, CreateAccountProps, SignInProps, VerifyOtpProps} from "@/types";
import { LocalAuth } from "./providers/local.auth";

const getAuthProvider = (): IAuthService => {
    return new LocalAuth();
};

export const createAccount = async (props: CreateAccountProps) => getAuthProvider().createAccount(props);
export const signInUser = async (props: SignInProps) => getAuthProvider().signInUser(props);
export const getCurrentUser = async () => getAuthProvider().getCurrentUser();
export const signOutUser = async () => getAuthProvider().signOutUser();
export const verifyOtp = async (props: VerifyOtpProps) => getAuthProvider().verifyOtp(props);
export const resendOtp = async (props: { email: string }) => getAuthProvider().resendOtp(props);
export const getUserById = async (id: string) => getAuthProvider().getUserById(id);
export const getShareableUsers = async (keyword?: string) => getAuthProvider().getShareableUsers(keyword);
export const refreshSessionToken = async (refreshToken: string, accessToken: string) => getAuthProvider().refreshSessionToken(refreshToken, accessToken);
export const forgotPassword = async (props: { email: string }) => getAuthProvider().forgotPassword(props);
export const verifyPasswordResetOtp = async (props: { email: string; otp: string }) => getAuthProvider().verifyPasswordResetOtp(props);
export const resetPassword = async (props: { email: string; newPassword: string }) => getAuthProvider().resetPassword(props);