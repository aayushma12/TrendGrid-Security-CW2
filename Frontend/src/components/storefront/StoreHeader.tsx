"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ANNOUNCEMENTS, MEGA_NAV, STORE, type NavItem } from "@/lib/shop-data";
import { fashionSrc } from "@/lib/fashion-images";
import { useStore } from "@/lib/store-context";

/* -- tiny inline icon set (announcement bar) ------------------------------- */
function BarIcon({ name }: { name: string }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "truck") return (<svg {...common}><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>);
  if (name === "clock") return (<svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>);
  if (name === "shield") return (<svg {...common}><path d="M12 2l8 4v6c0 5-3.4 7.7-8 10-4.6-2.3-8-5-8-10V6z" /></svg>);
  return (<svg {...common}><path d="M12 2l2.4 6.2L21 9.3l-5 4.3 1.6 6.7L12 16.9 6.4 20.3 8 13.6l-5-4.3 6.6-1.1z" /></svg>);
}

export function StoreHeader({ cartCount }: { cartCount?: number }) {
  const { count, openCart, openSearch } = useStore();
  // Prefer live cart state from context; fall back to the prop if provided.
  const displayCount = cartCount ?? count;
  const [scrolled, setScrolled] = useState(false);
  const [annIndex, setAnnIndex] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [bounce, setBounce] = useState(false);
  const prevCount = useRef(displayCount);

  // bounce the badge whenever the count increases
  useEffect(() => {
    if (count > prevCount.current) {
      setBounce(true);
      const id = setTimeout(() => setBounce(false), 450);
      prevCount.current = count;
      return () => clearTimeout(id);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAnnIndex((i) => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* ---------------------------------------------- announcement bar */}
      <div className="lux-topbar">
        <div className="container lux-topbar__inner">
          <span className="lux-topbar__side">Concierge {STORE.supportPhone}</span>
          <div className="lux-topbar__ticker" aria-live="polite">
            {ANNOUNCEMENTS.map((a, i) => (
              <span key={i} className={`lux-topbar__msg${i === annIndex ? " is-active" : ""}`}>
                <BarIcon name={a.icon} /> {a.text}
              </span>
            ))}
          </div>
          <div className="lux-topbar__side lux-topbar__side--end">
            <span>Free returns</span>
            <span className="lux-topbar__dots" aria-hidden>
              {ANNOUNCEMENTS.map((_, i) => (
                <i key={i} className={i === annIndex ? "is-active" : ""} />
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- header */}
      <header
        className={`lux-header${scrolled ? " is-scrolled" : ""}`}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="container lux-header__inner">
          <Link href="/" className="lux-brand" aria-label={STORE.name}>
            <span className="lux-brand__mark">C</span>
            <span className="lux-brand__word">CLOTHING</span>
          </Link>

          <nav className="lux-nav" aria-label="Primary">
            {MEGA_NAV.map((item) => (
              <div
                key={item.label}
                className="lux-nav__item"
                onMouseEnter={() => setOpenMenu(item.columns ? item.label : null)}
              >
                <Link href={item.href} className={`lux-nav__link${item.label === "Sale" ? " is-sale" : ""}`}>
                  {item.label}
                </Link>
                {item.columns && openMenu === item.label && <MegaMenu item={item} />}
              </div>
            ))}
          </nav>

          <div className="lux-actions">
            <button type="button" className="lux-action" aria-label="Search" onClick={openSearch}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </button>
            <Link href="/profile#wishlist" className="lux-action" aria-label="Wishlist">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </Link>
            <Link href="/profile" className="lux-action" aria-label="Account">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </Link>
            <button type="button" className="lux-action" aria-label="Cart" onClick={openCart}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              {displayCount > 0 && <span className={`lux-action__count${bounce ? " is-bouncing" : ""}`}>{displayCount}</span>}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function MegaMenu({ item }: { item: NavItem }) {
  return (
    <div className="lux-mega" role="menu">
      <div className="container lux-mega__inner">
        <div className="lux-mega__cols">
          {item.columns?.map((col) => (
            <div key={col.title} className="lux-mega__col">
              <p className="lux-mega__title">{col.title}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {item.preview && (
          <Link href={item.preview.href} className="lux-mega__preview">
            <Image
              src={fashionSrc(item.preview.seed, 520, 640)}
              alt={item.preview.label}
              fill
              sizes="320px"
              className="lux-mega__previewImg"
            />
            <span className="lux-mega__previewBody">
              <span className="lux-mega__previewLabel">{item.preview.label}</span>
              <span className="lux-mega__previewCap">{item.preview.caption}</span>
              <span className="lux-mega__previewCta">Discover &rarr;</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
