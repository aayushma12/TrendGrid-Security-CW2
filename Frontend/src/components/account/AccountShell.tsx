import type { ReactNode } from "react";
import { AccountTabs } from "./AccountTabs";
import { QuerySwitcher } from "./QuerySwitcher";

export function AccountShell({
  userName,
  subtitle,
  tenants,
  currentTenant,
  customers,
  currentCustomer,
  children,
}: {
  userName: string;
  subtitle?: string;
  tenants: { slug: string; name: string }[];
  currentTenant?: string;
  customers: { value: string; label: string }[];
  currentCustomer?: string;
  children: ReactNode;
}) {
  const initials = userName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <>
      <div className="acct-hero">
        <div className="acct-hero__avatar">{initials || "U"}</div>
        <div style={{ flex: 1 }}>
          <div className="acct-hero__name">Hello, {userName} 👋</div>
          <div className="acct-hero__sub">{subtitle ?? "Manage your orders, wishlist and details."}</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <QuerySwitcher param="tenant" ariaLabel="Switch store" current={currentTenant} options={tenants.map((t) => ({ value: t.slug, label: t.name }))} />
          <QuerySwitcher param="customer" ariaLabel="Switch customer" current={currentCustomer} options={customers} />
        </div>
      </div>
      <AccountTabs />
      {children}
    </>
  );
}
