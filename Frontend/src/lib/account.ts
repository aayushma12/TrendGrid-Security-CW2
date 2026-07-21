import { prisma } from "./db";

/**
 * Resolve the demo customer context for the storefront account area.
 * Without auth, we pick the tenant (?tenant=) and a customer (?customer=<userId>
 * or the first customer). In production this would come from the session.
 */
export async function getAccountContext(
  searchParams: Promise<{ tenant?: string; customer?: string }>,
) {
  const { tenant: tenantSlug, customer: customerUserId } = await searchParams;

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });
  const tenant =
    (tenantSlug ? tenants.find((t: (typeof tenants)[number]) => t.slug === tenantSlug) : undefined) ??
    tenants[0] ??
    null;

  const empty: { value: string; label: string }[] = [];
  if (!tenant) {
    return { tenant: null, tenants, customer: null, user: null, customerOptions: empty };
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } } },
    orderBy: { totalSpent: "desc" },
  });
  const customer =
    (customerUserId ? customers.find((c: (typeof customers)[number]) => c.userId === customerUserId) : undefined) ??
    customers[0] ??
    null;

  const customerOptions = customers.map((c: (typeof customers)[number]) => ({
    value: c.userId ?? "",
    label: `${c.user?.firstName ?? ""} ${c.user?.lastName ?? ""}`.trim() || (c.user?.email ?? "Customer"),
  }));

  return { tenant, tenants, customer, user: customer?.user ?? null, customerOptions };
}
