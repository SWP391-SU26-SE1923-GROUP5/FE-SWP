export class AdminPermissionError extends Error {
    constructor() {
        super("You do not have permission to perform this action.");
        this.name = "AdminPermissionError";
    }
}

export class AdminValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AdminValidationError";
    }
}
