import { getAccountContext } from "@/lib/account";
import { AccountShell } from "@/components/account/AccountShell";
import { acctMoney, NoCustomer } from "@/components/account/helpers";

export const dynamic = "force-dynamic";

export default async function AccountProfile({ searchParams }: { searchParams: Promise<{ tenant?: string; customer?: string }> }) {
  const ctx = await getAccountContext(searchParams);
  if (!ctx.tenant || !ctx.customer || !ctx.user) return <NoCustomer title="Profile" />;
  const u = ctx.user;
  const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "there";
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <AccountShell userName={name} tenants={ctx.tenants} currentTenant={ctx.tenant.slug}
      customers={ctx.customerOptions}
      currentCustomer={u.id}>
      <div className="acct-section-grid">
        {/* edit details */}
        <div className="acct-card">
          <div className="acct-card__head">Profile details</div>
          <div className="acct-card__body">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.4rem" }}>
              <div className="acct-avatar-lg">{initials}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{name}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.84rem" }}>{u.email}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "0.9rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <label className="acct-field">First name
                  <input className="acct-input" defaultValue={u.firstName ?? ""} /></label>
                <label className="acct-field">Last name
                  <input className="acct-input" defaultValue={u.lastName ?? ""} /></label>
              </div>
              <label className="acct-field">Email address
                <input className="acct-input" type="email" defaultValue={u.email} /></label>
              <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.3rem" }}>
                <button className="acct-btn" type="button">Save changes</button>
                <button className="acct-btn acct-btn--ghost" type="button">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        {/* summary */}
        <div className="acct-card">
          <div className="acct-card__head">Account summary</div>
          <div className="acct-card__body">
            <dl className="acct-dl">
              <dt>Member since</dt><dd>{new Date(u.createdAt as string | Date).toLocaleDateString()}</dd>
              <dt>Total orders</dt><dd>{ctx.customer.totalOrders}</dd>
              <dt>Lifetime value</dt><dd>{acctMoney(Number(ctx.customer.lifetimeValue))}</dd>
              <dt>Marketing emails</dt>
              <dd>
                <span className={`acct-pill acct-pill--${ctx.customer.marketingOptIn ? "green" : "gray"}`}>
                  {ctx.customer.marketingOptIn ? "Subscribed" : "Not subscribed"}
                </span>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
