import { apiRequest, clearStoredUser, setStoredUser } from "./client";
import type { AuthTokensPayload, AuthUser, LoginResult } from "./types";
import { isMfaChallenge } from "./types";
import { ApiError } from "./client";
import { STAFF_ROLES, type AuthScope } from "../roles";

export interface LoginInput {
  email: string;
  password: string;
  /** Only sent/enforced once a CAPTCHA provider is configured — see CaptchaWidget. */
  captchaToken?: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  captchaToken?: string;
  acceptTerms: boolean;
}

/**
 * Revokes the session server-side (refresh token + httpOnly cookies) —
 * the API sets those cookies on every successful login/register regardless
 * of what this app decides to do with the response, so rejecting a login
 * here (e.g. the admin-role check below) must also actually call this,
 * not just skip storing anything client-side.
 */
async function revokeSession(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // Best-effort — the cookies may already be gone/expired; nothing to surface to the user.
  } finally {
    clearStoredUser();
  }
}

/**
 * Shared gate applied once real tokens+user are in hand, regardless of
 * whether they came straight from /auth/login or via the MFA challenge at
 * /auth/mfa/verify — both paths must enforce the same scope rules.
 */
async function gateAndStore(scope: AuthScope, payload: AuthTokensPayload): Promise<AuthTokensPayload> {
  const { user } = payload;

  if (scope === "admin" && !STAFF_ROLES.has(user.role)) {
    await revokeSession();
    throw new ApiError("You do not have permission to access the admin console.", 403, [
      { field: "email", message: "Admin or editor role required." },
    ]);
  }

  if (!user.isActive) {
    await revokeSession();
    throw new ApiError(
      scope === "admin" ? "Your account is disabled. Contact an administrator." : "Your account is disabled. Contact support.",
      403,
    );
  }

  setStoredUser(user);
  return payload;
}

/**
 * Shared login for both admin and customer scopes. Unlike the old
 * scope-specific functions, this always returns a `LoginResult` — callers
 * must check `isMfaChallenge()` before assuming tokens were issued. Role
 * enforcement (admin scope requires ADMIN/EDITOR) happens in `gateAndStore`,
 * which runs here for a non-MFA account, or after `verifyMfaLogin` for one
 * that has MFA enrolled — the role isn't actually confirmed until the
 * second factor is checked, since /auth/login alone doesn't return a user
 * for an MFA-enrolled account.
 */
export async function login(scope: AuthScope, input: LoginInput): Promise<LoginResult> {
  const res = await apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
    }),
  });

  if (isMfaChallenge(res.data)) return res.data;
  return gateAndStore(scope, res.data);
}

/** Second factor for an MFA-enrolled account — exchanges the challenge token + a TOTP/backup code for real session tokens. */
export async function verifyMfaLogin(scope: AuthScope, mfaToken: string, code: string): Promise<AuthTokensPayload> {
  const res = await apiRequest<AuthTokensPayload>("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ mfaToken, code: code.trim() }),
  });
  return gateAndStore(scope, res.data);
}

/**
 * Customer self-registration. Backend always assigns role USER regardless of
 * input, and the endpoint auto-logs the new account in (sets session cookies
 * immediately), so this caches the profile right away too.
 */
export async function registerCustomer(input: RegisterInput): Promise<AuthTokensPayload> {
  const res = await apiRequest<AuthTokensPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phoneNumber: input.phoneNumber?.trim() || undefined,
      password: input.password,
      acceptTerms: input.acceptTerms,
      ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
    }),
  });

  setStoredUser(res.data.user);
  return res.data;
}

export async function logoutSession(): Promise<void> {
  await revokeSession();
}

/** "Log out everywhere" — revokes every refresh token for this account, including the current one. */
export async function logoutAllDevices(): Promise<void> {
  try {
    await apiRequest("/auth/logout-all", { method: "POST" });
  } finally {
    clearStoredUser();
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  // A password change revokes every other session server-side; the current
  // one stays valid (fresh cookies aren't reissued, the existing ones still work).
}

export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
}

/** Step 1 of enrollment — generates a pending TOTP secret. Not active until confirmed with a code. */
export async function setupMfa(): Promise<MfaSetupResult> {
  const res = await apiRequest<MfaSetupResult>("/auth/mfa/setup", { method: "POST" });
  return res.data;
}

/** Step 2 — proves the authenticator app is actually configured correctly; enables MFA and returns one-time backup codes. */
export async function confirmMfaSetup(code: string): Promise<{ backupCodes: string[] }> {
  const res = await apiRequest<{ backupCodes: string[] }>("/auth/mfa/setup/confirm", {
    method: "POST",
    body: JSON.stringify({ code: code.trim() }),
  });
  return res.data;
}

/** Email MFA enrollment step 1 — sends a confirmation code to the user's own inbox, nothing to display yet. */
export async function setupMfaEmail(): Promise<void> {
  await apiRequest("/auth/mfa/setup/email", { method: "POST" });
}

/** Step 2 — proves the user received the emailed code; enables MFA and returns one-time backup codes. */
export async function confirmMfaEmailSetup(code: string): Promise<{ backupCodes: string[] }> {
  const res = await apiRequest<{ backupCodes: string[] }>("/auth/mfa/setup/email/confirm", {
    method: "POST",
    body: JSON.stringify({ code: code.trim() }),
  });
  return res.data;
}

/** Re-sends the login-challenge email code — for the "didn't get it? resend" link on the MFA step. */
export async function resendMfaLoginOtp(mfaToken: string): Promise<void> {
  await apiRequest("/auth/mfa/resend", {
    method: "POST",
    body: JSON.stringify({ mfaToken }),
  });
}

export async function disableMfa(currentPassword: string): Promise<void> {
  await apiRequest("/auth/mfa/disable", {
    method: "POST",
    body: JSON.stringify({ currentPassword }),
  });
}

/** Always resolves the same way whether or not the email is registered — see the API's own doc comment. */
export async function forgotPassword(email: string, captchaToken?: string): Promise<void> {
  await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), ...(captchaToken ? { captchaToken } : {}) }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

/**
 * Read-only check the reset-password page calls before rendering the form —
 * lets it show "this link is no longer valid" immediately for an
 * expired/used/malformed token instead of only failing on submit.
 */
export async function validateResetToken(token: string): Promise<boolean> {
  try {
    const res = await apiRequest<{ valid: boolean }>(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
    return res.data.valid;
  } catch {
    return false;
  }
}

export async function verifyEmail(token: string): Promise<void> {
  await apiRequest("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/** Authenticated — registration auto-signs the account in, so the resend link on /verify-email always has a session to use. */
export async function resendVerificationEmail(): Promise<void> {
  await apiRequest("/auth/verify-email/resend", { method: "POST" });
}

export type { AuthUser };
