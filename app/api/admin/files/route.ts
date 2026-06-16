import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    AdminFileQuerySchema,
} from "@/lib/admin/validations";
import {
    AdminPermissionError,
    AdminValidationError,
    getAdminFiles,
} from "@/lib/actions/admin.actions";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const query = AdminFileQuerySchema.parse({
            search: url.searchParams.get("search") ?? "",
            type: url.searchParams.get("type") ?? "all",
            sort: url.searchParams.get("sort") ?? "$createdAt-desc",
            page: url.searchParams.get("page") ?? 1,
            limit: url.searchParams.get("limit") ?? 20,
        });
        const data = await getAdminFiles(query);
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
    if (error instanceof z.ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: "Validation failed.",
                details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
            },
            { status: 400 }
        );
    }
    console.error("[admin/files] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
}
