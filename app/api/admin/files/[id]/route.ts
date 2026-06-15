import { NextRequest, NextResponse } from "next/server";
import {
    AdminPermissionError,
    AdminValidationError,
    deleteAdminFile,
} from "@/lib/actions/admin.actions";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const data = await deleteAdminFile(id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleError(error);
    }
}

function handleError(error: unknown) {
    if (error instanceof AdminPermissionError) {
        return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    if (error instanceof AdminValidationError) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("[admin/files/[id]] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
}
