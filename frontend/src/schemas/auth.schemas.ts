import { z } from 'zod';
import type { TFunction } from 'i18next';

export const createLoginSchema = (t: TFunction) =>
    z.object({
        email: z.string().email(t('auth.login.emailInvalid')),
        password: z.string().min(1, t('auth.login.passwordRequired')),
    });

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export const createRegisterSchema = (t: TFunction) =>
    z.object({
    email: z.string().email(t('auth.register.emailInvalid')),
    password: z.string().min(8, t('auth.register.passwordMin')),
    tenantName: z.string().min(1, t('auth.register.companyNameRequired')),
    firstName: z.string().optional(),
    lastName: z.string().optional(), 
    inviteCode: z.string().optional(), 
});

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>