import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import { IAdminService, AdminDashboardDto, AdminUserDto, UpdateAdminUserDto } from "@/types";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

if (!connection_url) {
    throw new Error("Missing NEXT_PUBLIC_API_URL environment variable.");
}

export class LocalAdmin implements IAdminService {
    private async getHeaders() {
        const session = await auth();

        if (!session?.accessToken || session.error === "RefreshAccessTokenError" || session.user?.role?.toLowerCase() !== "admin") {
            redirect("/sign-in");
        }

        return {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    private handleError(error: unknown, context: string): never {
        const err = error as Record<string, unknown>;
        if (err && typeof err === 'object' && typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(`${context} Error:`, error);
        throw error;
    }

    async getDashboard(): Promise<AdminDashboardDto | null> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Admin/dashboard`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404 || res.status === 400 || res.status === 403 || res.status === 401) {
                    return null;
                }
                throw new Error(`[${res.status}] Failed to fetch admin dashboard`);
            }

            const data = await res.json() as AdminDashboardDto;
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetAdminDashboard");
        }
    }

    async getUsers(): Promise<AdminUserDto[]> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/User`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404 || res.status === 400 || res.status === 403 || res.status === 401) {
                    return [];
                }
                throw new Error(`[${res.status}] Failed to fetch admin users`);
            }

            const data = await res.json() as AdminUserDto[];
            return parseStringify(data ?? []);
        } catch (error) {
            this.handleError(error, "GetAdminUsers");
        }
    }

    async updateUser(id: string, updateData: UpdateAdminUserDto): Promise<AdminUserDto | null> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/User/${id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(updateData),
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404 || res.status === 400 || res.status === 403 || res.status === 401) {
                    return null;
                }
                throw new Error(`[${res.status}] Failed to update admin user`);
            }

            const data = await res.json() as AdminUserDto;
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "UpdateAdminUser");
        }
    }
}
