import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import { IAnalyticsService, DashboardDto } from "@/types";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export class LocalAnalytics implements IAnalyticsService {
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

    async getDashboard(): Promise<DashboardDto | null> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Analytics/dashboard`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404 || res.status === 400) return null;
                throw new Error(`[${res.status}] Failed to fetch analytics dashboard`);
            }

            const data = await res.json();
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetAnalyticsDashboard");
        }
    }
}