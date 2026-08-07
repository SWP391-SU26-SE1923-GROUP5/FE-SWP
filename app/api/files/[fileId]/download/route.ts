import { auth } from "@/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    const { fileId } = await params;
    const session = await auth();
    if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
        return new Response("Unauthorized", { status: 401 });
    }

    const connection_url = process.env.NEXT_PUBLIC_API_URL;
    if (!connection_url) {
        return new Response("API URL not configured", { status: 500 });
    }

    try {
        const res = await fetch(`${connection_url}/api/Document/${fileId}/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`
            }
        });

        if (!res.ok) {
            return new Response(`Failed to fetch from backend: ${res.statusText}`, { status: res.status });
        }

        const contentType = res.headers.get("content-type") || "application/octet-stream";
        
        return new Response(res.body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store, max-age=0"
            }
        });
    } catch (error) {
        return new Response("Internal Server Error", { status: 500 });
    }
}
