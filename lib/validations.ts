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

    dateOfBirth: z
        .string()
        .min(1, { message: 'Date of birth is required.' })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please select a valid date.' }),
});