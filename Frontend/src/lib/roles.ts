import type { AuthUser } from "./api/types";

/** Roles that belong in the admin console, never the customer storefront. */
export const STAFF_ROLES = new Set<AuthUser["role"]>(["ADMIN", "EDITOR"]);

export const isStaffRole = (role: AuthUser["role"] | undefined | null): boolean =>
  Boolean(role && STAFF_ROLES.has(role));

/** Which backend login flow/role-gate applies — admin console vs storefront. */
export type AuthScope = "admin" | "customer";
