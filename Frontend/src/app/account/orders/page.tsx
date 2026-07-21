import { prisma } from "@/lib/db";
import { getAccountContext } from "@/lib/account";
import { AccountShell } from "@/components/account/AccountShell";
import { acctMoney, AcctPill, AcctEmpty, NoCustomer } from "@/components/account/helpers";

export const dynamic = "force-dynamic";

export default async function AccountOrders({ searchParams }: { searchParams: Promise<{ tenant?: string; customer?: string }> }) {
  const ctx = await getAccountContext(searchParams);
  if (!ctx.tenant || !ctx.customer || !ctx.user) return <NoCustomer title="Orders" />;

  const orders = await prisma.order.findMany({
    where: { tenantId: ctx.tenant.id, userId: ctx.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { title: true, quantity: true } } },
  });
  const name = `${ctx.user.firstName ?? ""} ${ctx.user.lastName ?? ""}`.trim() || "there";

  return (
    <AccountShell userName={name} tenants={ctx.tenants} currentTenant={ctx.tenant.slug}
      customers={ctx.customerOptions}
      currentCustomer={ctx.user.id}>
      <div className="acct-card">
        <div className="acct-card__head">Your orders ({orders.length})</div>
        {orders.length === 0 ? <div className="acct-card__body"><AcctEmpty title="No orders yet" /></div> : (
          <table className="acct-tbl">
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th>Payment</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {orders.map((o: (typeof orders)[number]) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                  <td>{new Date(o.createdAt as string | Date).toLocaleDateString()}</td>
                  <td>{o.items.map((it: (typeof o.items)[number]) => `${it.title} ×${it.quantity}`).join(", ")}</td>
                  <td><AcctPill status={o.status} /></td>
                  <td><AcctPill status={o.paymentStatus} /></td>
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
