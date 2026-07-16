import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col flex-1 w-full min-h-screen">
            {children}
        </div>
    );
}