"use client";

import Link from "next/link";
import { FadeUp } from "./motion";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue } from "@/lib/homepage-helpers";

/** Full-width lime CTA banner with dark type — high contrast. */
export function NexaCta() {
  const { content, visible } = useHomepageSection("sec_cta");
  const eyebrow = fieldValue(content, "eyebrow", "Limited Offer");
  const title = fieldValue(content, "title", "Get 25% Off Your First Order");
  const copy = fieldValue(
    content,
    "copy",
    "Join 25K+ members and unlock early access to drops, styling tips, and member-only pricing.",
  );
  const ctaPrimary = fieldValue(content, "ctaPrimary", "Claim the Offer");
  const ctaSecondary = fieldValue(content, "ctaSecondary", "Talk to a Stylist");

  if (!visible) return null;

  return (
    <section className="nx-section" style={{ paddingTop: 0 }}>
      <div className="nx-container">
        <FadeUp>
          <div className="nx-cta">
            <div className="nx-cta-glow" aria-hidden />
            <span className="nx-cta-eyebrow">{eyebrow}</span>
            <h2 className="nx-cta-title">{title}</h2>
            <p className="nx-cta-copy">{copy}</p>
            <div className="nx-cta-actions">
              <Link href="/shop" className="nx-btn nx-btn-dark">
                {ctaPrimary}
                <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/contact" className="nx-btn nx-btn-cta-ghost">
                {ctaSecondary}
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
