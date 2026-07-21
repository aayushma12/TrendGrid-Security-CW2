"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { isStaffRole } from "@/lib/roles";

/**
 * Mirror of AdminShell's guard, in the opposite direction: a STAFF_ROLES
 * session (ADMIN/EDITOR) is allowed to sign in via the storefront login
 * (see auth.ts's customer-scope login), but must not actually use the customer
 * dashboard. This covers sessions that land here without going through
 * /login at all — e.g. an admin who was already signed in navigating
 * straight to /orders, or a role change that happened mid-session.
 *
 * Only guards the customer-only account pages, not public browsing
 * (/shop, /collections, home) — staff can browse the storefront like
 * anyone else, they just can't use "their own" cart/checkout/orders/profile.
 */
const CUSTOMER_ONLY_PREFIXES = ["/cart", "/checkout", "/orders", "/profile"];

export function CustomerAreaGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  const isStaff = isAuthenticated && isStaffRole(user?.role);
  const isCustomerOnlyPath = CUSTOMER_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`),
  );
  const shouldRedirect = isStaff && isCustomerOnlyPath;

  useEffect(() => {
    if (loading || !shouldRedirect) return;
    router.replace("/admin");
  }, [loading, shouldRedirect, router]);

  if (!loading && shouldRedirect) return null;

  return <>{children}</>;
}
