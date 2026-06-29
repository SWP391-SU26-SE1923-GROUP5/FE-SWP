import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import { INotificationService, NotificationResponseDto } from "@/types";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export class LocalNotification implements INotificationService {
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

    async getMyNotifications(): Promise<NotificationResponseDto[]> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Notification/my`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok) {
                if (res.status === 404) return [];
                throw new Error(`[${res.status}] Failed to fetch notifications`);
            }

            const data = await res.json();
            return parseStringify(data || []);
        } catch (error) {
            this.handleError(error, "GetMyNotifications");
        }
    }

    async markAsRead(id: string): Promise<boolean> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Notification/${id}/read`, {
                method: 'PUT',
                headers,
            });

            return res.ok || res.status === 204;
        } catch (error) {
            this.handleError(error, "MarkAsRead");
        }
    }

    async markAllAsRead(): Promise<boolean> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${connection_url}/api/Notification/read-all`, {
                method: 'PUT',
                headers,
            });

            return res.ok || res.status === 204;
        } catch (error) {
            this.handleError(error, "MarkAllAsRead");
        }
    }
}