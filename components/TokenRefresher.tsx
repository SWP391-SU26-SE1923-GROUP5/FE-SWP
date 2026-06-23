"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

export function TokenRefresher() {
    const { data: session, update } = useSession();
    const isRefreshing = useRef(false);

    useEffect(() => {
        if (!session?.accessTokenExpiresAt || isRefreshing.current) return;

        if (session.error === "RefreshAccessTokenError") {
            signOut({ callbackUrl: "/sign-in" });
            return;
        }

        const timeRemaining = session.accessTokenExpiresAt - Date.now();
        const bufferTime = 10 * 1000;

        if (timeRemaining <= bufferTime) {
            isRefreshing.current = true;

            update({ forceRefresh: true }).finally(() => {
                isRefreshing.current = false;
            });
            return;
        }

        const timeUntilRefresh = timeRemaining - bufferTime;

        if (timeUntilRefresh > 0) {
            const timeout = setTimeout(() => {
                isRefreshing.current = true;
                update({ forceRefresh: true }).finally(() => {
                    isRefreshing.current = false;
                });
            }, timeUntilRefresh);

            return () => clearTimeout(timeout);
        }

    }, [session, update]);

    return null;
}