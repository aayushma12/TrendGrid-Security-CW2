import { prisma } from "./db";

/**
 * Resolve the active tenant for a request. Resolution order:
 *   1. `x-tenant` header (set by middleware / API clients)
 *   2. `?tenant=<slug>` query param (handy in local dev)
 *   3. Host subdomain (e.g. `aurora.example.com` -> `aurora`)
 *   4. Custom domain match
 *
 * Returns the tenant record or null. Multi-tenant isolation depends on every
 * query downstream filtering by the returned `tenant.id`.
 */
export async function resolveTenant(req: Request) {
  const url = new URL(req.url);
  const headerTenant = req.headers.get("x-tenant");
  const queryTenant = url.searchParams.get("tenant");
  const host = (req.headers.get("host") ?? url.host).split(":")[0];

  const slugCandidate = headerTenant ?? queryTenant ?? subdomainOf(host);

  if (slugCandidate) {
    const bySlug = await prisma.tenant.findFirst({
      where: {
        deletedAt: null,
        OR: [{ slug: slugCandidate }, { subdomain: slugCandidate }],
      },
    });
    if (bySlug) return bySlug;
  }

  // Custom domain
  const byDomain = await prisma.tenant.findFirst({
    where: { deletedAt: null, customDomain: host },
  });
  if (byDomain) return byDomain;

  // Dev fallback: first active tenant
  if (process.env.NODE_ENV !== "production") {
    return prisma.tenant.findFirst({ where: { deletedAt: null } });
  }

  return null;
}

function subdomainOf(host: string): string | null {
  // Ignore localhost / bare IPs
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0];
  return null;
}

/** Standardised 404 used when a tenant cannot be resolved. */
export function tenantNotFound() {
  return Response.json({ error: "Tenant not found" }, { status: 404 });
}
