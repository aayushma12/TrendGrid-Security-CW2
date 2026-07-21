import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side complement to CustomerAreaGuard / AdminShell (both of which
 * only run client-side, after the page has already loaded). This runs at
 * the edge before any page or API route handler executes, so a misrouted
 * session never gets a flash of content it shouldn't see, and an
 * unauthenticated request never reaches a CMS mutation.
 *
 * Deliberately does NOT verify the JWT itself (that would mean duplicating
 * the API's signing secret into this app). Instead it asks the API — the
 * one place a session is actually authoritative — via GET /auth/me,
 * forwarding the incoming cookies. If that call fails or the API is
 * unreachable, page routes fail OPEN (skip the redirect, page renders —
 * it's a UX/routing convenience, the API's own requireAuth/requireRole is
 * the real enforcement for actual data). The CMS API routes below fail
 * CLOSED instead: they have no other authorization layer of their own
 * (see src/app/api/v1/admin/** and src/app/api/v1/themes/**), so if this
 * middleware can't confirm a staff session, the request is rejected.
 */

const STAFF_ROLES = new Set(["ADMIN", "EDITOR"]);
const CUSTOMER_ONLY_PREFIXES = ["/cart", "/checkout", "/orders", "/profile"];
const ADMIN_LOGIN_PATH = "/admin/login";

// CMS write/edit surface — has no auth of its own (only tenant-scoping),
// so it's staff-only end to end. Everything under /api/v1/themes EXCEPT
// /active/tokens (the public "what does the live site look like" read used
// by the storefront itself) is the theme editor, not public data.
const isProtectedCmsApiPath = (pathname: string): boolean => {
  if (pathname.startsWith("/api/v1/admin/")) return true;
  if (pathname.startsWith("/api/v1/themes/") && !pathname.startsWith("/api/v1/themes/active")) return true;
  return false;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/api/v1/admin/:path*",
    "/api/v1/themes/:path*",
  ],
};

const unauthorizedJson = (status: 401 | 403, message: string) =>
  NextResponse.json({ success: false, statusCode: status, message }, { status });

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPagePath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminLogin = pathname === ADMIN_LOGIN_PATH;
  const isCmsApiPath = isProtectedCmsApiPath(pathname);

  const cookie = req.headers.get("cookie");
  if (!cookie) {
    if (isCmsApiPath) return unauthorizedJson(401, "Authentication required.");
    if (isAdminPagePath && !isAdminLogin) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url));
    }
    return NextResponse.next();
  }

  let role: string | null = null;
  try {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { cookie },
      signal: AbortSignal.timeout(3000),
    });
    if (meRes.ok) {
      const body = (await meRes.json()) as { data?: { role?: string } };
      role = body?.data?.role ?? null;
    }
  } catch {
    if (isCmsApiPath) return unauthorizedJson(401, "Could not verify session.");
    return NextResponse.next();
  }

  const isStaff = role ? STAFF_ROLES.has(role) : false;

  if (isCmsApiPath) {
    if (!isStaff) return unauthorizedJson(403, "Admin or editor role required.");
    return NextResponse.next();
  }

  const isCustomerOnlyPath = CUSTOMER_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isStaff && isCustomerOnlyPath) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // role is falsy here for both "no valid session" and "expired access token,
  // refreshable via the httpOnly refresh cookie" — don't redirect either case
  // away from /admin; the client-side AdminShell handles the refresh attempt
  // and only redirects once it's confirmed there's truly no session.
  if (role && !isStaff && isAdminPagePath && !isAdminLogin) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url));
  }

  return NextResponse.next();
}
