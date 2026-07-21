import type { ReactNode } from "react";

export function acctMoney(v: number | null | undefined, currency = "USD"): string {
  if (v == null) return "—";
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(v); }
  catch { return `$${v.toFixed(2)}`; }
}

const TONE: Record<string, string> = {
  delivered: "green", paid: "green", shipped: "blue", processing: "blue",
  pending: "amber", cancelled: "red", refunded: "red", unfulfilled: "gray", fulfilled: "green",
};
export function AcctPill({ status }: { status: string }) {
  return <span className={`acct-pill acct-pill--${TONE[status] ?? "gray"}`}>{status.replace(/_/g, " ")}</span>;
}

export function AcctEmpty({ icon = "📭", title, hint }: { icon?: string; title: string; hint?: ReactNode }) {
  return (
    <div className="acct-empty">
      <div className="acct-empty__icon">{icon}</div>
      <div style={{ color: "var(--text)", fontWeight: 700, marginTop: "0.4rem" }}>{title}</div>
      {hint && <div style={{ marginTop: "0.3rem" }}>{hint}</div>}
    </div>
  );
}

export function NoCustomer({ title }: { title: string }) {
  return (
    <div className="acct">
      <div className="acct-wrap">
        <h1>{title}</h1>
        <div className="acct-card"><div className="acct-card__body">
          <AcctEmpty icon="🌱" title="No customer data" hint="Seed the database, then open /account." />
        </div></div>
      </div>
    </div>
  );
}
