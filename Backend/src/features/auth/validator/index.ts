import { z } from 'zod';

import { createUserSchema } from '../../user/validator';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Only enforced server-side when CAPTCHA_PROVIDER is configured (see utils/captcha.ts).
  captchaToken: z.string().optional(),
});

export const registerSchema = createUserSchema.omit({ role: true }).extend({
  captchaToken: z.string().optional(),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, { message: 'You must accept the Terms of Service and Privacy Policy.' }),
});

export const refreshSchema = z.object({
  // Optional in the body — a browser client relies on the httpOnly cookie
  // instead; only non-cookie clients (Swagger/Postman/mobile) need this field.
  refreshToken: z.string().min(1).optional(),
});

export const logoutSchema = z.object({
  // Optional — when provided, that specific session is revoked server-side
  // instead of only being discarded client-side.
  refreshToken: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const mfaVerifySetupSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const mfaVerifyLoginSchema = z.object({
  mfaToken: z.string().min(1, 'MFA challenge token is required'),
  code: z.string().min(6, 'Code is required').max(16),
});

export const mfaResendSchema = z.object({
  mfaToken: z.string().min(1, 'MFA challenge token is required'),
});

export const mfaDisableSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  // Only enforced server-side when CAPTCHA_PROVIDER is configured (see utils/captcha.ts).
  captchaToken: z.string().optional(),
});

export const validateResetTokenQuerySchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
