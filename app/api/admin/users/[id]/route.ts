import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    AdminPermissionError,
    AdminValidationError,
    deleteAdminUser,
    getAdminUserById,
    updateAdminUser,
} from "@/lib/actions/admin.actions";
import { UpdateUserSchema } from "@/lib/admin/validations";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const user = await getAdminUserById(id);
        if (!user) {
            return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        return handleError(error);
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const json = await request.json();
        const parsed = UpdateUserSchema.parse(json);
        const data = await updateAdminUser(id, parsed);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleError(error);
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const data = await deleteAdminUser(id);
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
    console.error("[admin/users/[id]] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
}
