"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString() ? `?${params.toString()}` : "";
  return (
    <div className="acct-tabs">
      {TABS.map((t) => {
        const active = t.href === "/account" ? pathname === "/account" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={`${t.href}${qs}`} className="acct-tab" data-active={active}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
