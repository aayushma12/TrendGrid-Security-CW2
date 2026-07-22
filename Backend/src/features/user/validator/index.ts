import { z } from 'zod';
import { USER_ROLES } from '../constants';

const emailSchema = z.string().trim().toLowerCase().email('Invalid email');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: emailSchema,
  phoneNumber: z.string().trim().min(6).max(20).optional(),
  password: passwordSchema,
  role: z.enum(USER_ROLES).optional(),
});

export const updateUserSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),
    lastName: z.string().trim().min(1).max(60).optional(),
    phoneNumber: z.string().trim().min(6).max(20).optional(),
    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

/**
 * Self-service "edit my own profile" schema — deliberately excludes role,
 * isActive, email and every other privileged/identity field, by construction
 * rather than by a runtime guard. Even if a client sends `{"role":"ADMIN"}`,
 * zod strips unrecognized keys before this ever reaches the service, so
 * there's no mass-assignment surface here regardless of what the controller does.
 */
export const updateOwnProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),
    lastName: z.string().trim().min(1).max(60).optional(),
    phoneNumber: z.string().trim().min(6).max(20).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

/**
 * "Restore profile backup" — same allowed fields as updateOwnProfileSchema,
 * but `.strict()` so an uploaded backup containing extra keys (role, email,
 * orders, id, ...) is REJECTED outright with a clear validation error rather
 * than silently stripped. That's the "validate before importing" requirement:
 * fail loudly on anything unexpected instead of quietly ignoring it.
 */
export const importProfileSchema = z.object({
  profile: z
    .object({
      firstName: z.string().trim().min(1).max(60).optional(),
      lastName: z.string().trim().min(1).max(60).optional(),
      phoneNumber: z.string().trim().min(6).max(20).optional(),
    })
    .strict('Profile backup contains unrecognized or disallowed fields.'),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
});
