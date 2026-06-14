import { NextRequest, NextResponse } from "next/server";
import { getFileBuffer } from "@/lib/actions/file.actions";

export async function GET(req: NextRequest) {
    const bucketFileId = req.nextUrl.searchParams.get("bucketFileId");
    const mimeType = req.nextUrl.searchParams.get("mimeType") || "application/octet-stream";

    if (!bucketFileId) {
        return new NextResponse("Missing file ID", { status: 400 });
    }

    try {
        const buffer = await getFileBuffer(bucketFileId);

        const headers = new Headers();
        headers.set("Content-Type", mimeType);

        return new NextResponse(new Uint8Array(buffer), { headers, status: 200 });

    } catch (error: any) {
        console.error("[File Proxy Error]:", error);
        return new NextResponse("Failed to download file securely", { status: 500 });
    }
}