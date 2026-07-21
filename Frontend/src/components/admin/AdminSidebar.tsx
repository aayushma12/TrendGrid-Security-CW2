"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrderStats } from "@/lib/api/orders";

type Icon = (p: { className?: string }) => React.ReactElement;

const I = {
  dash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
  ),
  home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></svg>
  ),
  cat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><circle cx="17.5" cy="17.5" r="3.5" /></svg>
  ),
  prod: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7 12 3 4 7v10l8 4 8-4V7Z" /><path d="M4 7l8 4 8-4" /><path d="M12 21V11" /></svg>
  ),
  checkout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 4h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h9.3a1.6 1.6 0 0 0 1.6-1.3L21 8H6" /><circle cx="9" cy="21" r="1.3" /><circle cx="18" cy="21" r="1.3" /></svg>
  ),
  order: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6a2 2 0 0 1 2 2v0h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" /><rect x="9" y="2.5" width="6" height="4" rx="1.2" /><path d="M8.5 11h7M8.5 15h5" /></svg>
  ),
  store: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" /><path d="M3 9l1.5-5h15L21 9" /><path d="M9 20v-6h6v6" /></svg>
  ),
  discount: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9h.01M15 15h.01M8.5 8.5l7 7" /><path d="M4 8.8V5a1 1 0 0 1 1-1h3.8a2 2 0 0 1 1.4.6l8.5 8.5a2 2 0 0 1 0 2.8l-4.6 4.6a2 2 0 0 1-2.8 0L4.6 12a2 2 0 0 1-.6-1.4Z" /></svg>
  ),
  banner: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="7" rx="1.5" /><path d="M7 15h10M7 19h6" /></svg>
  ),
  star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.2l1-5.8-4.2-4.1 5.9-.9Z" /></svg>
  ),
  users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-2.3-4.5" /></svg>
  ),
  layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>
  ),
  settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V19a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H11a1.7 1.7 0 0 0 1-1.5V5a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V11a1.7 1.7 0 0 0 1.5 1H19a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>
  ),
};

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  badge?: string;
}

const PRIMARY: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: I.dash },
  { href: "/admin/homepage", label: "Homepage", icon: I.home },
];

const CATALOG: NavItem[] = [
  { href: "/admin/categories", label: "Categories", icon: I.cat },
  { href: "/admin/collections", label: "Collections", icon: I.layers },
  { href: "/admin/products", label: "Products", icon: I.prod },
];

const MARKETING: NavItem[] = [
  { href: "/admin/discounts", label: "Discounts", icon: I.discount },
  { href: "/admin/banners", label: "Banners", icon: I.banner },
];

const COMMERCE: NavItem[] = [
  { href: "/admin/checkout", label: "Checkout", icon: I.checkout },
  { href: "/admin/orders", label: "Orders", icon: I.order },
  { href: "/admin/reviews", label: "Reviews", icon: I.star },
  { href: "/admin/customers", label: "Customers", icon: I.users },
];

const ACCOUNT: NavItem[] = [{ href: "/admin/settings", label: "Settings", icon: I.settings }];

export function AdminSidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);

  useEffect(() => {
    void getOrderStats()
      .then((res) => setPendingOrders(res.data.pendingOrders))
      .catch(() => setPendingOrders(null));
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const badgeFor = (item: NavItem): string | null => {
    if (item.href === "/admin/orders") return pendingOrders ? String(pendingOrders) : null;
    return item.badge ?? null;
  };

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const Ico = item.icon;
      const badge = badgeFor(item);
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`adm-nav-item${isActive(item.href) ? " is-active" : ""}`}
          onClick={() => setOpen(false)}
        >
          <Ico />
          <span>{item.label}</span>
          {badge && <span className="adm-nav-badge">{badge}</span>}
        </Link>
      );
    });

  return (
    <>
      <button
        className="adm-menu-btn adm-mobile-toggle"
        aria-label="Toggle menu"
        onClick={() => setOpen((v) => !v)}
        style={{ position: "fixed", top: 13, left: 14, zIndex: 70 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <div className="adm-scrim" data-open={open} onClick={() => setOpen(false)} aria-hidden />

      <aside className="adm-sidebar" data-open={open}>
        <div className="adm-brand">
          <span className="adm-brand-dot">◆</span>
          <span>
            TrendGrid
            <small>Admin Console</small>
          </span>
        </div>

        <div className="adm-nav-label">Main</div>
        {renderItems(PRIMARY)}

        <div className="adm-nav-label">Catalog</div>
        {renderItems(CATALOG)}

        <div className="adm-nav-label">Marketing</div>
        {renderItems(MARKETING)}

        <div className="adm-nav-label">Commerce</div>
        {renderItems(COMMERCE)}

        <div className="adm-nav-label">Account</div>
        {renderItems(ACCOUNT)}

        <div className="adm-sidebar-foot">
          <a href="/" target="_blank" rel="noreferrer" className="adm-nav-item" style={{ paddingLeft: 11 }}>
            <I.store />
            <span>View storefront</span>
          </a>
          {onLogout && (
            <button
              type="button"
              className="adm-nav-item adm-nav-btn"
              style={{ paddingLeft: 11, width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
              onClick={onLogout}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
