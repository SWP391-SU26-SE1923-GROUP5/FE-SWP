import { IAuthService, CreateAccountProps, SignInProps, User } from "@/types";
import { auth, signOut } from "@/auth";
import { parseStringify } from "@/lib/utils";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export class LocalAuth implements IAuthService {
    private handleError(error: any, context: string): never {
        if (error && typeof error === 'object' && error.digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(`[LocalAuth:${context}]`, error instanceof Error ? error.message : error);
        throw error;
    }

    async createAccount({ fullName, email, password, dateOfBirth }: CreateAccountProps) {
        const res = await fetch(`${connection_url}/api/Auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName,
                email,
                password,
                dateOfBirth
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(`[${res.status}] ${data.message || "Failed to register account"}`);
        }

        return parseStringify({ email: data.email });
    }

    async signInUser({ email, password }: SignInProps) {
        const res = await fetch(`${connection_url}/api/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(`[${res.status}] ${data.message || "Invalid email or password"}`);
        }

        const sessionData = {
            user: {
                id: data.user.id,
                fullName: data.user.fullName,
                email: data.user.email,
                role: data.user.role,
                dateOfBirth: data.user.dateOfBirth,
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
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const session = await auth();

            if (session && session.user) {
                const user = {
                    id: session.user.id,
                    email: session.user.email!,
                    fullName: session.user.name!,
                    role: session.user.role,
                } as User;

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
                const currentUser = {
                    id: session.user.id,
                    email: session.user.email!,
                    fullName: session.user.name!,
                    role: session.user.role,
                } as User;

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
                throw new Error(`[${res.status}] ${errorData.message || "Failed to fetch users"}`);
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

    async signOutUser() {
        await signOut({ redirectTo: "/sign-in" });
    }

    async refreshSessionToken(refreshToken: string, accessToken: string) {
        const res = await fetch(`${connection_url}/api/Auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ refreshToken })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(`[${res.status}] ${data.message || "Failed to refresh token"}`);
        }

        return parseStringify(data);
    }

    async verifyOtp({ email, otp }: { email: string; otp: string }): Promise<string> {
        try {
            const res = await fetch(`${connection_url}/api/Auth/verify-registration-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || "Verification failed"}`);
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

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(`[${res.status}] ${data.message || "Resend OTP failed"}`);
            }

            return parseStringify(data.message || "OTP resent successfully.");
        } catch (error) {
            this.handleError(error, "resendOtp");
        }
    }
}