"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  loginAdmin,
  loginCustomer,
  logoutAdmin,
  logoutCustomer,
  registerCustomer,
  type LoginInput,
  type RegisterInput,
} from "@/lib/api/auth";
import { ApiError, getStoredUser } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

export type AuthScope = "admin" | "customer";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  /** Customer-only. Throws if called from an admin-scoped provider. */
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * `scope` determines which backend flow `login()`/`register()` use:
 *  - "admin": restricted to ADMIN/EDITOR roles (see loginAdmin).
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

  useEffect(() => {
    setUser(getStoredUser<AuthUser>());
    setLoading(false);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const session = scope === "admin" ? await loginAdmin(input) : await loginCustomer(input);
      setUser(session.user);
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

  const logout = useCallback(() => {
    if (scope === "admin") logoutAdmin();
    else logoutCustomer();
    setUser(null);
  }, [scope]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function formatAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.errors.length > 0) return err.errors.map((e) => e.message).join(" ");
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
