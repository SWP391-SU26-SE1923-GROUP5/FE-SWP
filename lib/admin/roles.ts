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

const ADMIN_ROLE_VALUES = new Set<string>(["admin", "Admin", "ADMIN"]);

export const isAdminRoleValue = (role: string | null | undefined): boolean => {
    if (!role) return false;
    return ADMIN_ROLE_VALUES.has(role);
};

export const getUserRole = (user: User | null | undefined): UserRole => {
    if (!user) return "user";
    if (isAdminRoleValue(user.role)) return "admin";
    if (isAdminEmail(user.email)) return "admin";
    return "user";
};

export const isAdmin = (user: User | null | undefined): boolean => getUserRole(user) === "admin";
