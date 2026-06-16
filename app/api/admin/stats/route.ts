import { NextResponse } from "next/server";
import {
    AdminPermissionError,
    getSystemStats,
} from "@/lib/actions/admin.actions";

export async function GET() {
    try {
        const data = await getSystemStats();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        if (error instanceof AdminPermissionError) {
            return NextResponse.json({ success: false, error: error.message }, { status: 403 });
        }
        console.error("[admin/stats] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
    }
}
