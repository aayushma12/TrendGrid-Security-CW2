"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  login as apiLogin,
  logoutAllDevices as apiLogoutAllDevices,
  logoutSession,
  registerCustomer,
  verifyMfaLogin,
  type LoginInput,
  type RegisterInput,
} from "@/lib/api/auth";
import { getUser } from "@/lib/api/users";
import { ApiError, getStoredUser, setStoredUser } from "@/lib/api/client";
import type { AuthUser, LoginResult } from "@/lib/api/types";
import type { AuthScope } from "@/lib/roles";

export type { AuthScope };

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Set from the login response (`PASSWORD_MAX_AGE_DAYS` on the API) — a soft
   *  signal only, not persisted across a page refresh; dismissed by the user
   *  or cleared once they change their password. */
  passwordExpired: boolean;
  dismissPasswordExpired: () => void;
  /** May resolve to an MFA challenge instead of a session — check `isMfaChallenge()` on the result. */
  login: (input: LoginInput) => Promise<LoginResult>;
  /** Second factor for the challenge `login()` returned. */
  completeMfaLogin: (mfaToken: string, code: string) => Promise<AuthUser>;
  /** Customer-only. Throws if called from an admin-scoped provider. */
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  /** Re-fetches the full profile (e.g. after MFA enroll/disable changes `mfaEnabled`). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * `scope` determines which backend flow `login()`/`register()` use:
 *  - "admin": restricted to ADMIN/EDITOR roles.
 *  - "customer": any active account may sign in; also exposes self-registration.
 *
 * Both scopes currently share the same localStorage session (single
 * browser-tab session, matching how the admin console and storefront are
 * used in practice) — signing into one signs out of the other in the same tab.
 */
export function AuthProvider({
  children,
  scope = "customer",
}: {
  children: React.ReactNode;
  scope?: AuthScope;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordExpired, setPasswordExpired] = useState(false);

  // Deliberately deferred to an effect rather than a useState lazy
  // initializer: getStoredUser() reads localStorage, which is unavailable
  // during SSR. Reading it synchronously during the client's first render
  // (hydration) would return a different value than the server-rendered
  // output and trigger a hydration mismatch — this way the first client
  // render matches SSR (null/loading), then swaps in the real value.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(getStoredUser<AuthUser>());
    setLoading(false);
  }, []);

  // Dispatched by apiRequest() when a 401 survives a refresh attempt — the
  // refresh token itself is gone, so this really is a dead session, not just
  // an expired access token. Clears the UI's "logged in" state so guards
  // (e.g. AdminShell) redirect to login instead of showing stale content.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await apiLogin(scope, input);
      if ("mfaRequired" in result) return result;
      setUser(result.user);
      setPasswordExpired(result.passwordExpired);
      return result;
    },
    [scope],
  );

  const completeMfaLogin = useCallback(
    async (mfaToken: string, code: string) => {
      const session = await verifyMfaLogin(scope, mfaToken, code);
      setUser(session.user);
      setPasswordExpired(session.passwordExpired);
      return session.user;
    },
    [scope],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      if (scope !== "customer") {
        throw new ApiError("Self-registration is not available for admin accounts.", 403);
      }
      const session = await registerCustomer(input);
      setUser(session.user);
    },
    [scope],
  );

  const logout = useCallback(async () => {
    await logoutSession();
    setUser(null);
    setPasswordExpired(false);
  }, []);

  const logoutAllDevices = useCallback(async () => {
    await apiLogoutAllDevices();
    setUser(null);
    setPasswordExpired(false);
  }, []);

  const dismissPasswordExpired = useCallback(() => setPasswordExpired(false), []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const res = await getUser(user.id);
    setStoredUser(res.data);
    setUser(res.data);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      passwordExpired,
      dismissPasswordExpired,
      login,
      completeMfaLogin,
      register,
      logout,
      logoutAllDevices,
      refreshUser,
    }),
    [
      user,
      loading,
      passwordExpired,
      dismissPasswordExpired,
      login,
      completeMfaLogin,
      register,
      logout,
      logoutAllDevices,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** The `code` on the first error entry, if the API sent one (e.g. `ACCOUNT_LOCKED`, `CSRF_INVALID`). */
export function getAuthErrorCode(err: unknown): string | undefined {
  if (err instanceof ApiError) return err.errors.find((e) => e.code)?.code;
  return undefined;
}

export function formatAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.statusCode === 429) {
      return "Too many attempts. Please wait a few minutes before trying again.";
    }
    if (getAuthErrorCode(err) === "CSRF_INVALID") {
      return "Your session is out of date — please refresh the page and try again.";
    }
    if (err.errors.length > 0) return err.errors.map((e) => e.message).join(" ");
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
