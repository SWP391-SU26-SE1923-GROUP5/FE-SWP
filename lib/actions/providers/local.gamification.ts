import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import { IGamificationService, LeaderboardEntryDto, UserStatsResponseDto } from "@/types";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export class LocalGamification implements IGamificationService {
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

    private handleError(error: unknown, context: string): never {
        const err = error as Record<string, unknown>;
        if (err && typeof err === 'object' && typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(`${context} Error:`, error);
        throw error;
    }

    async getLeaderboard(top: number = 20, period: string = 'weekly'): Promise<LeaderboardEntryDto[]> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Gamification/leaderboard?top=${top}&period=${encodeURIComponent(period)}`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404) return [];
                throw new Error(`[${res.status}] Failed to fetch leaderboard`);
            }

            const data = await res.json();
            return parseStringify(data || []);
        } catch (error) {
            this.handleError(error, "GetLeaderboard");
        }
    }

    async getMyStats(): Promise<UserStatsResponseDto | null> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Gamification/stats`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error(`[${res.status}] Failed to fetch user stats`);
            }

            const data = await res.json();
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetMyStats");
        }
    }
}