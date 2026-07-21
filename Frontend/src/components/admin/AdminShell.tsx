"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/auth-context";

/** Admin and customer logins currently share one localStorage session (see
 *  auth-context.tsx), so `isAuthenticated` alone isn't enough here — a
 *  signed-in customer navigating straight to /admin would otherwise see the
 *  full console. Only an ADMIN/EDITOR account counts as "in" for this shell;
 *  loginAdmin() already rejects other roles at sign-in, this is the
 *  complementary guard for sessions that started elsewhere (e.g. the
 *  storefront login) or were valid once but had their role changed.
 */
const STAFF_ROLES = new Set(["ADMIN", "EDITOR"]);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();

  const isLoginPage = pathname === "/admin/login";
  const isStaff = isAuthenticated && Boolean(user && STAFF_ROLES.has(user.role));

  useEffect(() => {
    if (loading) return;
    if (!isStaff && !isLoginPage) {
      // A non-staff session (e.g. a customer account) still gets logged out
      // here — otherwise they'd bounce right back to /admin/login while
      // "signed in", which just re-triggers this same redirect.
      if (isAuthenticated && !isStaff) logout();
      router.replace("/admin/login");
      return;
    }
    if (isStaff && isLoginPage) {
      router.replace("/admin/categories");
    }
  }, [loading, isAuthenticated, isStaff, isLoginPage, router, logout]);

  if (isLoginPage) {
    return <div className="adm adm-login-shell">{children}</div>;
  }

  if (loading) {
    return (
      <div className="adm adm-login-shell">
        <div className="adm-login-card">
          <p className="adm-login-sub">Loading admin session…</p>
        </div>
      </div>
    );
  }

  if (!isStaff) return null;

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "AD";

  return (
    <div className="adm">
      <AdminSidebar onLogout={logout} />
      <div className="adm-main">
        <header className="adm-topbar">
          <div className="adm-mobile-toggle" style={{ width: 38 }} aria-hidden />
          <div>
            <div className="adm-crumb">TrendGrid Admin</div>
            <h1>Admin Console</h1>
          </div>
          <div className="adm-topbar-spacer" />
          <input className="adm-search" placeholder="Search…" aria-label="Search" />
          <div className="adm-avatar" title={user?.email ?? "Admin"}>
            {initials}
          </div>
        </header>
        <main className="adm-content">{children}</main>
      </div>
    </div>
  );
}
