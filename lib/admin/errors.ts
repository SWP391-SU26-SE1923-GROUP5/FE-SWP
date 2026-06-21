/**
 * Admin module error classes.
 *
 * These live in their own module (no "use server") so that Next.js allows
 * classes to be imported from server actions files. Server actions files
 * only allow async function exports.
 */

export class AdminPermissionError extends Error {
    constructor(message = "You do not have permission to perform this action.") {
        super(message);
        this.name = "AdminPermissionError";
    }
}

export class AdminValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AdminValidationError";
    }
}

export class AdminBackendError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = "AdminBackendError";
        this.status = status;
        this.body = body;
    }
}
