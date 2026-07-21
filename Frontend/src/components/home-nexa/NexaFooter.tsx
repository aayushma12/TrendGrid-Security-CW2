"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store-context";
import { FadeUp } from "./motion";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue } from "@/lib/homepage-helpers";

const COLS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Products",
    links: [
      { label: "About", href: "/shop" },
      { label: "Shop", href: "/shop" },
      { label: "Careers", href: "/shop" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Category",
    links: [
      { label: "Coats", href: "/shop" },
      { label: "Dresses", href: "/shop" },
      { label: "Shirts", href: "/shop" },
      { label: "Accessories", href: "/shop" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our mission", href: "/#about" },
      { label: "Contact us", href: "/contact" },
      { label: "Your profile", href: "/profile" },
      { label: "Admin Login", href: "/admin/login" },
    ],
  },
];

/** Dark footer with brand statement and newsletter signup. */
export function NexaFooter() {
  const { showToast } = useStore();
  const [email, setEmail] = useState("");
  const { content, visible } = useHomepageSection("sec_footer");
  const brand = fieldValue(content, "brand", "TrendGrid");
  const tagline = fieldValue(content, "tagline", "Your Destination for Modern Premium Fashion");
  const copyright = fieldValue(
    content,
    "copyright",
    `© ${new Date().getFullYear()} TrendGrid. All Rights Reserved.`,
  );

  if (!visible) return null;

  return (
    <footer className="nx-footer">
      <div className="nx-container">
        <FadeUp>
          <div className="nx-footer-top">
            <Link href="/" className="nx-logo" aria-label={`${brand} home`}>
              <span className="nx-logo-mark" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M4 7h16M4 12h10M4 17h16" />
                </svg>
              </span>
              {brand}
            </Link>
            <p className="nx-footer-tag">
              {tagline}
            </p>
          </div>
        </FadeUp>

        <div className="nx-footer-cols">
          {COLS.map((c) => (
            <div key={c.title}>
              <h4>{c.title}</h4>
              {c.links.map((l) => (
                <Link key={l.label} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}

          <div>
            <h4>Join our newsletter</h4>
            <form
              className="nx-news-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                showToast("Thanks for subscribing!");
                setEmail("");
              }}
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button type="submit" className="nx-btn nx-btn-accent">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="nx-footer-bottom">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
