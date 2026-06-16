import type { User } from "@/types";
import type { UserRole } from "@/types/admin";

export type { UserRole } from "@/types/admin";

const ADMIN_ENV_VAR = "ADMIN_EMAILS";

export const getAdminEmails = (): string[] => {
    const raw = process.env[ADMIN_ENV_VAR];
    if (!raw) return [];
    return raw
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
};

export const isAdminEmail = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return getAdminEmails().includes(email.trim().toLowerCase());
};

export const getUserRole = (user: User | null | undefined): UserRole => {
    if (!user) return "user";
    if (user.role === "admin") return "admin";
    if (isAdminEmail(user.email)) return "admin";
    return "user";
};

export const isAdmin = (user: User | null | undefined): boolean => getUserRole(user) === "admin";
