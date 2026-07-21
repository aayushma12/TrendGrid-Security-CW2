import { apiRequest, clearAuthSession, setAuthSession } from "./client";
import type { AuthTokensPayload, AuthUser } from "./types";
import { ApiError } from "./client";

const ADMIN_ROLES = new Set<AuthUser["role"]>(["ADMIN", "EDITOR"]);

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export async function loginAdmin(input: LoginInput): Promise<AuthTokensPayload> {
  const res = await apiRequest<AuthTokensPayload>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });

  const { accessToken, refreshToken, user } = res.data;

  if (!ADMIN_ROLES.has(user.role)) {
    clearAuthSession();
    throw new ApiError("You do not have permission to access the admin console.", 403, [
      { field: "email", message: "Admin or editor role required." },
    ]);
  }

  if (!user.isActive) {
    clearAuthSession();
    throw new ApiError("Your account is disabled. Contact an administrator.", 403);
  }

  setAuthSession(accessToken, refreshToken, user);
  return res.data;
}

/**
 * Customer-facing login for the storefront. Unlike `loginAdmin`, this does not
 * restrict by role — any active account (USER, EDITOR, or ADMIN) may sign in
 * to browse, order and track from the shop side.
 */
export async function loginCustomer(input: LoginInput): Promise<AuthTokensPayload> {
  const res = await apiRequest<AuthTokensPayload>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });

  const { accessToken, refreshToken, user } = res.data;

  if (!user.isActive) {
    clearAuthSession();
    throw new ApiError("Your account is disabled. Contact support.", 403);
  }

  setAuthSession(accessToken, refreshToken, user);
  return res.data;
}

/**
 * Customer self-registration. Backend always assigns role USER regardless of
 * input, and the endpoint auto-logs the new account in (returns tokens, not
 * just a user record), so this stores the session immediately on success.
 */
export async function registerCustomer(input: RegisterInput): Promise<AuthTokensPayload> {
  const res = await apiRequest<AuthTokensPayload>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phoneNumber: input.phoneNumber?.trim() || undefined,
      password: input.password,
    }),
  });

  const { accessToken, refreshToken, user } = res.data;
  setAuthSession(accessToken, refreshToken, user);
  return res.data;
}

export function logoutAdmin(): void {
  clearAuthSession();
}

export function logoutCustomer(): void {
  clearAuthSession();
}
