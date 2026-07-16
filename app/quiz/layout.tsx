import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col flex-1 max-w-3xl w-full m-auto h-screen p-6">
            {children}
        </div>
    );
}