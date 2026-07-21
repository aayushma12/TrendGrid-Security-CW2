import "@/styles/account.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { STORE } from "@/lib/shop-data";

const NAV = [
  { href: "/", label: "Store" },
  { href: "/shop", label: "Shop" },
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="acct">
      {/* ----------------------------------------------------------- header */}
      <header className="acct-top">
        <Link href="/account" className="acct-brand">
          <span className="acct-brand__mark">C</span>
          <span className="acct-brand__name">{STORE.name}<i>Account</i></span>
        </Link>

        <nav className="acct-nav" aria-label="Account navigation">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="acct-nav__link">{n.label}</Link>
          ))}
        </nav>

        <div className="acct-top__spacer" />
        <Link href="/" className="acct-tab acct-top__back">← Back to store</Link>
        <div className="acct-avatar" aria-hidden>U</div>
      </header>

      {/* ------------------------------------------------------------ body */}
      <div className="acct-wrap">{children}</div>

      {/* ---------------------------------------------------------- footer */}
      <footer className="acct-foot">
        <div className="acct-foot__inner">
          <div className="acct-foot__brand">
            <div className="acct-brand">
              <span className="acct-brand__mark">C</span>
              <span className="acct-brand__name">{STORE.name}</span>
            </div>
            <p className="acct-foot__blurb">
              Considered wardrobe staples and quiet luxury — made in limited runs,
              finished by hand, worn for years.
            </p>
            <p className="acct-foot__contact">
              <span>{STORE.address}</span>
              <span>{STORE.phone}</span>
            </p>
          </div>

          <div className="acct-foot__col">
            <h4>My Account</h4>
            <Link href="/account">Overview</Link>
            <Link href="/account/orders">Orders</Link>
            <Link href="/account/wishlist">Wishlist</Link>
            <Link href="/account/addresses">Addresses</Link>
            <Link href="/account/profile">Profile</Link>
          </div>

          <div className="acct-foot__col">
            <h4>Shop</h4>
            <Link href="/shop?audience=Women">Women</Link>
            <Link href="/shop?audience=Men">Men</Link>
            <Link href="/shop?audience=Accessories">Accessories</Link>
            <Link href="/shop">New In</Link>
          </div>

          <div className="acct-foot__col">
            <h4>Help</h4>
            <Link href="/shop">Shipping &amp; returns</Link>
            <Link href="/#faq">FAQ</Link>
            <Link href="/shop">Size guide</Link>
            <Link href="/">Contact us</Link>
          </div>
        </div>

        <div className="acct-foot__bar">
          <span>© {year} {STORE.name} All rights reserved.</span>
          <span className="acct-foot__legal">
            <Link href="/">Privacy</Link>
            <Link href="/">Terms</Link>
            <Link href="/">Cookies</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
