import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    tenantName: z.string().min(1, 'Company name is required'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),  
});

export type RegisterFormData = z.infer<typeof registerSchema>