import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAccountContext } from "@/lib/account";
import { AccountShell } from "@/components/account/AccountShell";
import { acctMoney, AcctPill, AcctEmpty, NoCustomer } from "@/components/account/helpers";

export const dynamic = "force-dynamic";

export default async function AccountOverview({ searchParams }: { searchParams: Promise<{ tenant?: string; customer?: string }> }) {
  const ctx = await getAccountContext(searchParams);
  if (!ctx.tenant || !ctx.customer || !ctx.user) return <NoCustomer title="Overview" />;

  const [recent, wishlist] = await Promise.all([
    prisma.order.findMany({ where: { tenantId: ctx.tenant.id, userId: ctx.user.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 5, include: { _count: { select: { items: true } } } }),
    prisma.wishlist.findFirst({ where: { tenantId: ctx.tenant.id, userId: ctx.user.id } }),
  ]);
  const wishCount = Array.isArray(wishlist?.items) ? (wishlist!.items as unknown[]).length : 0;
  const name = `${ctx.user.firstName ?? ""} ${ctx.user.lastName ?? ""}`.trim() || "there";

  return (
    <AccountShell
      userName={name}
      tenants={ctx.tenants}
      currentTenant={ctx.tenant.slug}
      customers={ctx.customerOptions}
      currentCustomer={ctx.user.id}
    >
      <div className="acct-stats">
        <div className="acct-stat"><div className="acct-stat__label">Total orders</div><div className="acct-stat__value">{ctx.customer.totalOrders}</div></div>
        <div className="acct-stat"><div className="acct-stat__label">Total spent</div><div className="acct-stat__value">{acctMoney(Number(ctx.customer.totalSpent))}</div></div>
        <div className="acct-stat"><div className="acct-stat__label">Wishlist</div><div className="acct-stat__value">{wishCount}</div></div>
      </div>

      <div className="acct-card">
        <div className="acct-card__head" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Recent orders</span>
          <Link href={`/account/orders?tenant=${ctx.tenant.slug}&customer=${ctx.user.id}`} style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" }}>View all →</Link>
        </div>
        {recent.length === 0 ? <div className="acct-card__body"><AcctEmpty title="No orders yet" /></div> : (
          <table className="acct-tbl">
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {recent.map((o: (typeof recent)[number]) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                  <td>{new Date(o.createdAt as string | Date).toLocaleDateString()}</td>
                  <td className="acct-num">{o._count.items}</td>
                  <td><AcctPill status={o.status} /></td>
                  <td className="acct-num" style={{ textAlign: "right" }}>{acctMoney(Number(o.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AccountShell>
  );
}
