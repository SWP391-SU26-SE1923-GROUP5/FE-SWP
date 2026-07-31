import {IAuthService, CreateAccountProps, SignInProps, User, AuthMessageResponse, AuthErrorResponse, LoginResponse} from "@/types";
import {auth, signOut} from "@/auth";
import {parseStringify} from "@/lib/utils";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

if (!connection_url) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable.");
}

export class LocalAuth implements IAuthService {
    private handleError(error: unknown, context: string): never {
        const err = error as Record<string, unknown>;
        if (err && typeof err === 'object' && typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(`[LocalAuth:${context}]`, error instanceof Error ? error.message : error);
        throw error;
    }

    async createAccount({ fullName, email, password }: CreateAccountProps) {
        try {
            const res = await fetch(`${connection_url}/api/Auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            const data = await res.json().catch(() => ({})) as { email: string | null } & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "Failed to register account"}`);
            }

            return parseStringify({ email: data.email });
        } catch (error) {
            this.handleError(error, "createAccount");
        }
    }

    async signInUser({ email, password }: SignInProps) {
        try {
            const res = await fetch(`${connection_url}/api/Auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await res.json().catch(() => ({})) as LoginResponse & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "Invalid email or password"}`);
            }

            const sessionData = {
                user: {
                    id: data.user.id,
                    fullName: data.user.fullName,
                    email: data.user.email,
                    role: data.user.role,
                    currentStorageCapacity: data.user.currentStorageCapacity,
                    currentAiTokenUsage: data.user.currentAiTokenUsage,
                    status: data.user.status,
                    createdAt: data.user.createdAt,
                    updatedAt: data.user.updatedAt,
                },
                accessToken: data.accessToken,
                accessTokenExpiresAt: data.accessTokenExpiresAt,
                refreshToken: data.refreshToken,
                refreshTokenExpiresAt: data.refreshTokenExpiresAt
            };

            return parseStringify(sessionData);
        } catch (error) {
            this.handleError(error, "signInUser");
        }
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const session = await auth();

            if (session && session.user) {
                const user: User = {
                    id: session.user.id!,
                    email: session.user.email!,
                    fullName: session.user.name!,
                    role: session.user.role,
                };

                return parseStringify(user);
            }
            return null;
        } catch {
            return null;
        }
    }

    async getUserById(id: string): Promise<User> {
        try {
            const session = await auth();

            if (session && session.user && session.user.id === id) {
                const currentUser: User = {
                    id: session.user.id!,
                    email: session.user.email!,
                    fullName: session.user.name!,
                    role: session.user.role,
                };

                return parseStringify(currentUser);
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (session?.accessToken) {
                headers['Authorization'] = `Bearer ${session.accessToken}`;
            }

            const res = await fetch(`${connection_url}/api/User/shareable`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData.message || errorData.error || errorData.title || "Failed to fetch users"}`);
            }

            const usersData: User[] = await res.json();

            const targetUser = usersData.find((user) => user.id === id);

            if (!targetUser) {
                throw new Error("[404] User not found");
            }

            return parseStringify(targetUser);
        } catch (error) {
            this.handleError(error, "getUserById");
        }
    }

    async getShareableUsers(keyword?: string): Promise<User[]> {
        try {
            const session = await auth();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (session?.accessToken) {
                headers['Authorization'] = `Bearer ${session.accessToken}`;
            }
            const url = keyword && keyword.trim()
                ? `${connection_url}/api/User/shareable?keyword=${encodeURIComponent(keyword.trim())}`
                : `${connection_url}/api/User/shareable`;
            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData.message || errorData.error || errorData.title || "Failed to fetch shareable users"}`);
            }
            const data: User[] = await res.json();
            return parseStringify(data || []);
        } catch (error) {
            this.handleError(error, "getShareableUsers");
        }
    }

    async signOutUser() {
        await signOut({ redirectTo: "/sign-in" });
    }

    async refreshSessionToken(refreshToken: string, accessToken: string) {
        try {
            const res = await fetch(`${connection_url}/api/Auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await res.json().catch(() => ({})) as { accessToken: string; refreshToken: string; accessTokenExpiresAt: string; } & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "Failed to refresh token"}`);
            }

            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "refreshSessionToken");
        }
    }

    async verifyOtp({ email, otp }: { email: string; otp: string }): Promise<string> {
        try {
            const res = await fetch(`${connection_url}/api/Auth/verify-registration-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await res.json().catch(() => ({})) as AuthMessageResponse & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "Verification failed"}`);
            }

            return parseStringify(data.message || "Verification successful");
        } catch (error) {
            this.handleError(error, "verifyOtp");
        }
    }

    async resendOtp({ email }: { email: string }): Promise<string> {
        try {
            const res = await fetch(`${connection_url}/api/Auth/resend-registration-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json().catch(() => ({})) as AuthMessageResponse & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "Resend OTP failed"}`);
            }

            return parseStringify(data.message || "OTP resent successfully.");
        } catch (error) {
            this.handleError(error, "resendOtp");
        }
    }

    async forgotPassword({ email }: { email: string }): Promise<AuthMessageResponse> {
        try {
            const res = await fetch(`${connection_url}/api/Auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json().catch(() => ({})) as AuthMessageResponse & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "Forgot password request failed"}`);
            }

            return parseStringify({ message: data.message || "If the email exists, an OTP has been sent." });
        } catch (error) {
            this.handleError(error, "forgotPassword");
        }
    }

    async verifyPasswordResetOtp({ email, otp }: { email: string; otp: string }): Promise<AuthMessageResponse> {
        try {
            const res = await fetch(`${connection_url}/api/Auth/verify-password-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await res.json().catch(() => ({})) as AuthMessageResponse & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "OTP verification failed"}`);
            }

            return parseStringify({ message: data.message || "OTP verified successfully." });
        } catch (error) {
            this.handleError(error, "verifyPasswordResetOtp");
        }
    }

    async resetPassword({ email, newPassword }: { email: string; newPassword: string }): Promise<AuthMessageResponse> {
        try {
            const res = await fetch(`${connection_url}/api/Auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword })
            });

            const data = await res.json().catch(() => ({})) as AuthMessageResponse & AuthErrorResponse;

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || data.error || data.title || "Password reset failed"}`);
            }

            return parseStringify({ message: data.message || "Password reset successfully." });
        } catch (error) {
            this.handleError(error, "resetPassword");
        }
    }
}