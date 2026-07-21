import { prisma } from "@/lib/db";
import { getAccountContext } from "@/lib/account";
import { AccountShell } from "@/components/account/AccountShell";
import { AcctEmpty, NoCustomer } from "@/components/account/helpers";

export const dynamic = "force-dynamic";

export default async function AccountAddresses({ searchParams }: { searchParams: Promise<{ tenant?: string; customer?: string }> }) {
  const ctx = await getAccountContext(searchParams);
  if (!ctx.tenant || !ctx.customer || !ctx.user) return <NoCustomer title="Addresses" />;

  const addresses = await prisma.orderAddress.findMany({
    where: { tenantId: ctx.tenant.id, order: { userId: ctx.user.id } },
    orderBy: { createdAt: "desc" },
  });
  // dedupe by line1+city+zip
  const seen = new Set<string>();
  const unique = addresses.filter((a: (typeof addresses)[number]) => {
    const key = `${a.line1}|${a.city}|${a.zip}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const name = `${ctx.user.firstName ?? ""} ${ctx.user.lastName ?? ""}`.trim() || "there";

  return (
    <AccountShell userName={name} tenants={ctx.tenants} currentTenant={ctx.tenant.slug}
      customers={ctx.customerOptions}
      currentCustomer={ctx.user.id}>
      {unique.length === 0 ? (
        <div className="acct-card"><div className="acct-card__body"><AcctEmpty icon="📍" title="No saved addresses" /></div></div>
      ) : (
        <div className="acct-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {unique.map((a: (typeof unique)[number]) => (
            <div className="acct-card" key={a.id}>
              <div className="acct-card__body">
                <div style={{ fontWeight: 700 }}>{a.firstName} {a.lastName}</div>
                <div style={{ color: "var(--muted)", marginTop: "0.4rem", fontSize: "0.88rem", lineHeight: 1.5 }}>
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                  {a.city}, {a.state} {a.zip}<br />
                  {a.country}
                </div>
                <span className="acct-pill acct-pill--blue" style={{ marginTop: "0.7rem", display: "inline-flex" }}>{a.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
