import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import { IProfileService, UserTierInfoDto, AchievementDto } from "@/types";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export class LocalProfile implements IProfileService {
    private async getHeaders() {
        const session = await auth();

        if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
            redirect("/sign-in");
        }

        return {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    private handleError(error: any, context: string): never {
        if (error && typeof error === 'object' && error.digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(`${context} Error:`, error);
        throw error;
    }

    async getMyTierInfo(): Promise<UserTierInfoDto | null> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/User/me/tier`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error(`[${res.status}] Failed to fetch tier info`);
            }

            const data = await res.json();
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetMyTierInfo");
        }
    }

    async getMyAchievements(): Promise<AchievementDto[]> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Gamification/achievements`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404) return [];
                throw new Error(`[${res.status}] Failed to fetch achievements`);
            }

            const data = await res.json();
            return parseStringify(data || []);
        } catch (error) {
            this.handleError(error, "GetMyAchievements");
        }
    }
}