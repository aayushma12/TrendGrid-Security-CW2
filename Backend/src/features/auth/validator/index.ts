import { z } from 'zod';

import { createUserSchema } from '../../user/validator';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Only enforced server-side when CAPTCHA_PROVIDER is configured (see utils/captcha.ts).
  captchaToken: z.string().optional(),
});

export const registerSchema = createUserSchema.omit({ role: true }).extend({
  captchaToken: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
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

export const mfaDisableSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
});
