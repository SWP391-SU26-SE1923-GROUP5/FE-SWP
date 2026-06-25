import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { parseStringify } from "@/lib/utils";
import { IPaymentService, TierMembership } from "@/types";

const connection_url = process.env.NEXT_PUBLIC_API_URL;

export class LocalPayment implements IPaymentService {
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

    async getMembershipTiers(): Promise<TierMembership[]> {
        try {
            const res = await fetch(`${connection_url}/api/TierMembership`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData.message || "Failed to fetch membership tiers"}`);
            }

            const data = await res.json();
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetMembershipTiers");
        }
    }

    async createCheckoutSession(tierId: string): Promise<void> {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/Payment/create-checkout-url`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ tierId })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData.message || "Failed to generate payment URL"}`);
            }

            const data = await res.json();

            if (data?.paymentUrl) {
                redirect(data.paymentUrl);
            } else {
                throw new Error("Missing paymentUrl in response");
            }
        } catch (error) {
            this.handleError(error, "CreateCheckoutSession");
        }
    }

    async getCurrentUserTier() {
        try {
            const headers = await this.getHeaders();

            const res = await fetch(`${connection_url}/api/User/me/tier`, {
                method: 'GET',
                headers
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(`[${res.status}] ${errorData.message || "Failed to fetch current user tier"}`);
            }

            const data = await res.json();
            return parseStringify(data);
        } catch (error) {
            this.handleError(error, "GetCurrentUserTier");
        }
    }
}