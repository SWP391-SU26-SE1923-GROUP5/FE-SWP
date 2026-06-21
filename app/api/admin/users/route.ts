import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {AdminPermissionError, AdminValidationError, getAdminUsers} from "@/lib/actions/admin.actions";
import {AdminUserQuerySchema} from "@/lib/admin/validations";

const QuerySchema = AdminUserQuerySchema;

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const query = QuerySchema.parse({
            search: url.searchParams.get("search") ?? "",
            role: url.searchParams.get("role") ?? "all",
            sort: url.searchParams.get("sort") ?? "$createdAt-desc",
            page: url.searchParams.get("page") ?? 1,
            limit: url.searchParams.get("limit") ?? 20,
        });
        const data = await getAdminUsers(query);
        return NextResponse.json({success: true, data});
    } catch (error) {
        return handleError(error);
    }
}

function handleError(error: unknown) {
    if (error instanceof AdminPermissionError) {
        return NextResponse.json({success: false, error: error.message}, {status: 403});
    }
    if (error instanceof AdminValidationError) {
        return NextResponse.json({success: false, error: error.message}, {status: 400});
    }
    if (error instanceof z.ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: "Validation failed.",
                details: error.issues.map((i) => ({path: i.path.join("."), message: i.message})),
            },
            {status: 400}
        );
    }
    console.error("[admin/users] error:", error);
    return NextResponse.json({success: false, error: "Internal server error."}, {status: 500});
}
