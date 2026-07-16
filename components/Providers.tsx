"use client";

import { SessionProvider } from "next-auth/react";
import { TokenRefresher } from "./TokenRefresher";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <TokenRefresher />
            {children}
        </SessionProvider>
    );
}