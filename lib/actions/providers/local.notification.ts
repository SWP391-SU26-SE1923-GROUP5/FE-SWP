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
            let res = await fetch(`${connection_url}/api/Notification/my`, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (!res.ok && (res.status === 404 || res.status === 405)) {
                res = await fetch(`${connection_url}/api/notifications`, {
                    method: 'GET',
                    headers,
                    cache: 'no-store',
                });
            }

            if (!res.ok && (res.status === 404 || res.status === 405)) {
                res = await fetch(`${connection_url}/api/Notification`, {
                    method: 'GET',
                    headers,
                    cache: 'no-store',
                });
            }

            if (!res.ok) {
                console.warn(`[GetMyNotifications] API returned status ${res.status}`);
                return [];
            }

            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data?.notifications || data?.data || data?.items || []);
            return parseStringify(arr);
        } catch (error) {
            console.warn("[GetMyNotifications] Failed to fetch notifications:", error);
            return [];
        }
    }

    async markAsRead(id: string): Promise<boolean> {
        try {
            const headers = await this.getHeaders();
            let res = await fetch(`${connection_url}/api/Notification/${id}/read`, {
                method: 'PUT',
                headers,
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${connection_url}/api/notifications/${id}/read`, {
                    method: 'PUT',
                    headers,
                });
            }

            return res.ok || res.status === 204;
        } catch (error) {
            this.handleError(error, "MarkAsRead");
        }
    }

    async markAllAsRead(): Promise<boolean> {
        try {
            const headers = await this.getHeaders();
            let res = await fetch(`${connection_url}/api/Notification/read-all`, {
                method: 'PUT',
                headers,
            });

            if (!res.ok && res.status === 404) {
                res = await fetch(`${connection_url}/api/notifications/read-all`, {
                    method: 'PUT',
                    headers,
                });
            }

            return res.ok || res.status === 204;
        } catch (error) {
            this.handleError(error, "MarkAllAsRead");
        }
    }
}