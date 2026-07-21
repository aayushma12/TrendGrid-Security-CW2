"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useStore } from "@/lib/store-context";
import { useAuth } from "@/lib/auth-context";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue, repeaterItems } from "@/lib/homepage-helpers";
import { EASE } from "./motion";
import { NexaAnnounce } from "./NexaAnnounce";

/**
 * Sticky navbar: announcement bar, blur background, search / profile / cart
 * actions with live cart badge, and a lime scroll-progress line.
 */
const THEME_KEY = "ndh.nxtheme";

const DEFAULT_NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Contact", href: "/contact" },
];

export function NexaHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const reduce = useReducedMotion();
  const { count, openCart, openSearch, showToast } = useStore();
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const { content } = useHomepageSection("sec_header");
  const brand = fieldValue(content, "brand", "TrendGrid");
  const nav = repeaterItems(content, "nav", DEFAULT_NAV);

  /* Load + apply persisted theme. */
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(THEME_KEY);
    } catch {
      /* ignore */
    }
    /* Light stays the default look — dark only when explicitly chosen. */
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.dataset.nxTheme = isDark ? "dark" : "light";
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.nxTheme = next ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 28, mass: 0.4 });

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        className={`nx-header${scrolled ? " is-scrolled" : ""}`}
        initial={reduce ? false : { y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <NexaAnnounce />
        <div className="nx-container nx-header-inner">
          <Link href="/" className="nx-logo" aria-label="TrendGrid home">
            <span className="nx-logo-mark" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </span>
            {brand}
          </Link>

          <nav className="nx-nav" aria-label="Primary">
            {nav.map((link, i) => (
              <Link
                key={`${link.href}-${i}`}
                href={link.href || "#"}
                className={pathname === link.href ? "is-active" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nx-header-actions">
            <button
              className="nx-icon-btn"
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={toggleTheme}
            >
              {dark ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 13.2A8.6 8.6 0 0 1 10.8 3 8.6 8.6 0 1 0 21 13.2Z" />
                </svg>
              )}
            </button>
            <button className="nx-icon-btn" aria-label="Search" onClick={openSearch}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="nx-icon-btn" aria-label="Your profile">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                  </svg>
                </Link>
                <button
                  type="button"
                  className="nx-icon-btn"
                  aria-label="Log out"
                  onClick={() => {
                    logout();
                    showToast("Signed out");
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nx-btn nx-btn-ghost nx-header-auth-btn">
                  Login
                </Link>
                <Link href="/register" className="nx-btn nx-btn-accent nx-header-auth-btn">
                  Register
                </Link>
              </>
            )}
            <button className="nx-icon-btn" aria-label="Open cart" onClick={openCart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2 3h3l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7H6" />
              </svg>
              {mounted && count > 0 && <span className="nx-cart-badge">{count}</span>}
            </button>
            <Link href="/shop" className="nx-btn nx-btn-dark">
              Shop Now
            </Link>
          </div>
        </div>
        <motion.span
          className="nx-progress"
          style={{ scaleX: progress }}
          aria-hidden
        />
      </motion.header>
    </>
  );
}
