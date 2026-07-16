"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFileStatus } from "@/lib/actions/file.actions";

interface StatusPollerProps {
    fileId: string;
    status: number;
}

export default function StatusPoller({ fileId, status }: StatusPollerProps) {
    const router = useRouter();

    useEffect(() => {
        if (status !== 5) return;

        const interval = setInterval(async () => {
            try {
                const res = await getFileStatus(fileId);

                if (res && res?.status !== 5 ) {
                    clearInterval(interval);
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error checking file status:", error);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [fileId, status]);

    return null;
}