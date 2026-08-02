import { z } from 'zod';

export const SignInSchema = z.object({
    email: z
        .string()
        .min(1, { message: 'Email is required.' })
        .email({ message: 'Please provide a valid email address.' }),

    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .max(100, { message: 'Password cannot exceed 100 characters.' })
})

export const SignUpSchema = z.object({
    fullName: z
        .string()
        .min(1, { message: 'Name is required.' })
        .max(50, { message: 'Name cannot exceed 50 characters.' })
        .regex(/^[\p{L}\s]+$/u, {
            message: 'Name can only contain letters and spaces.',
        }),

    email: z
        .string()
        .min(1, { message: 'Email is required.' })
        .email({ message: 'Please provide a valid email address.' }),

    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .max(100, { message: 'Password cannot exceed 100 characters.' })
        .regex(/[A-Z]/, {
            message: 'Password must contain at least one uppercase letter.',
        })
        .regex(/[a-z]/, {
            message: 'Password must contain at least one lowercase letter.',
        })
        .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
        .regex(/[^a-zA-Z0-9]/, {
            message: 'Password must contain at least one special character.',
        }),
    
    confirmPassword: z
        .string()
        .min(1, { message: "Please confirm your password." })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
});

export const ForgotPasswordEmailSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Email is required." })
        .max(255, { message: "Email cannot exceed 255 characters." })
        .email({ message: "Please provide a valid email address." })
});
export const ForgotPasswordOtpSchema = z.object({
    otp: z
        .string()
        .min(6, { message: "OTP must be exactly 6 digits." })
        .max(6, { message: "OTP must be exactly 6 digits." })
        .regex(/^[0-9]+$/, { message: "OTP must be a 6-digit number." })
});
export const ResetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(12, { message: "Password must be at least 12 characters long." })
        .max(128, { message: "Password cannot exceed 128 characters." })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
        .regex(/[0-9]/, { message: "Password must contain at least one number." })
        .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." })
        .refine((val) => !/\s/.test(val), { message: "Password must not contain whitespace." }),
    confirmPassword: z
        .string()
        .min(1, { message: "Please confirm your new password." })
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
});

export const SubjectSchema = z.object({
    subjectCode: z
        .string()
        .min(1, { message: "Subject code is required." })
        .max(20, { message: "Subject code must not exceed 20 characters." }),
    subjectName: z
        .string()
        .min(1, { message: "Subject name is required." })
        .max(255, { message: "Subject name must not exceed 255 characters." }),
    description: z
        .string()
        .max(1000, { message: "Description must not exceed 1000 characters." })
        .optional()
});