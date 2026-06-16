import { z } from "zod";

export const ROLE_VALUES = ["user", "admin"] as const;

const baseUserSchema = z.object({
    fullName: z
        .string()
        .min(1, { message: "Full name is required." })
        .max(50, { message: "Full name cannot exceed 50 characters." })
        .regex(/^[\p{L}\s]+$/u, { message: "Name can only contain letters and spaces." }),
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters long." })
        .max(30, { message: "Username cannot exceed 30 characters." })
        .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }),
    email: z
        .string()
        .min(1, { message: "Email is required." })
        .email({ message: "Please provide a valid email address." }),
    role: z.enum(ROLE_VALUES, { message: "Role must be either 'user' or 'admin'." }),
});

const passwordSchema = z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." });

export const CreateUserSchema = baseUserSchema.extend({
    password: passwordSchema,
});

export const UpdateUserSchema = baseUserSchema.extend({
    password: passwordSchema.optional().or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const AdminUserQuerySchema = z.object({
    search: z.string().trim().max(100).optional().default(""),
    role: z.enum(["all", ...ROLE_VALUES]).optional().default("all"),
    sort: z.string().optional().default("$createdAt-desc"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(200).optional().default(20),
});

export type AdminUserQuery = z.infer<typeof AdminUserQuerySchema>;

export const AdminFileQuerySchema = z.object({
    search: z.string().trim().max(100).optional().default(""),
    type: z.enum(["all", "document", "image", "video", "audio", "other"]).optional().default("all"),
    sort: z.string().optional().default("$createdAt-desc"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(200).optional().default(20),
});

export type AdminFileQuery = z.infer<typeof AdminFileQuerySchema>;
