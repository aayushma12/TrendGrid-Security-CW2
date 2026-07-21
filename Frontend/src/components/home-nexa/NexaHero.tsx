"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { fashionSrc } from "@/lib/fashion-images";
import { EASE, Parallax, SplitLetters } from "./motion";
import { NexaHeroShowcase } from "./NexaHeroShowcase";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue } from "@/lib/homepage-helpers";

const SOCIALS = [
  { label: "LinkedIn", d: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z" },
  { label: "Instagram", d: "M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.62 2.16 15.24 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.18 8.8 2.16 12 2.16Zm0 4.62a5.18 5.18 0 1 0 0 10.36 5.18 5.18 0 0 0 0-10.36Zm0 8.54a3.36 3.36 0 1 1 0-6.72 3.36 3.36 0 0 1 0 6.72Zm5.38-8.75a1.21 1.21 0 1 0 0-2.42 1.21 1.21 0 0 0 0 2.42Z" },
  { label: "X", d: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" },
  { label: "Facebook", d: "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.54-1.5h1.65V3.6c-.28-.04-1.26-.12-2.4-.12-2.38 0-4 1.45-4 4.12v2.3H7.6V13h2.68v8h3.22Z" },
];

/* Compact trust guarantees under the CTAs — quiet, premium reassurance. */
const TRUST = [
  { label: "Free Worldwide Shipping", d: "M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 1 0 0-.01M18 19a2 2 0 1 0 0-.01" },
  { label: "30-Day Easy Returns", d: "M4 9a8 8 0 1 1-1 4M4 4v5h5" },
  { label: "Secure Checkout", d: "M6 10V7a6 6 0 1 1 12 0v3M5 10h14v10H5z" },
];

/**
 * Hero v3 — premium editorial layout.
 * Left: eyebrow, grotesk + serif-italic headline (letter-staggered), copy,
 * shine-swept CTAs, star-rating proof and a quiet trust row.
 * Right: model in a framed card that reveals with a cinematic clip-path wipe
 * + slow Ken-Burns zoom, wrapped by a rotating seal badge, registration
 * corner ticks and a floating rating chip. Fully reduced-motion aware.
 */
export function NexaHero() {
  const reduce = useReducedMotion();
  const { content, visible } = useHomepageSection("sec_hero");
  const eyebrow = fieldValue(content, "eyebrow", "New Season Collection 2026");
  const titleLine1 = fieldValue(content, "titleLine1", "Elevate Your");
  const titleLine2 = fieldValue(content, "titleLine2", "Signature");
  const titleAccent = fieldValue(content, "titleAccent", "Style");
  const copy = fieldValue(
    content,
    "copy",
    "Explore modern fashion with carefully selected styles designed for every moment and lifestyle — premium fabrics, timeless cuts, zero compromise.",
  );
  const ctaPrimary = fieldValue(content, "ctaPrimary", "Explore Collection");
  const ctaSecondary = fieldValue(content, "ctaSecondary", "Browse Categories");

  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay, ease: EASE },
  });

  if (!visible) return null;

  return (
    <section className="nx-hero2">
      <div className="nx-hero-glow" aria-hidden />
      <div className="nx-hero2-noise" aria-hidden />
      <div className="nx-container nx-hero2-grid">
        <div className="nx-hero2-left">
          <motion.span className="nx-hero2-eyebrow" {...enter(0.05)}>
            <span className="nx-hero2-dot" aria-hidden />
            {eyebrow}
          </motion.span>

          <h1 className="nx-hero2-title">
            <SplitLetters text={titleLine1} delay={0.15} />
            <br />
            <SplitLetters text={titleLine2} delay={0.42} className="nx-title-em" />
            <SplitLetters text={titleAccent} delay={0.62} className="nx-title-accent" />
          </h1>

          <motion.p className="nx-hero2-copy" {...enter(0.55)}>
            {copy}
          </motion.p>

          <motion.div className="nx-hero2-cta" {...enter(0.68)}>
            <Link href="/shop" className="nx-btn nx-btn-accent nx-btn-shine">
              {ctaPrimary}
              <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link href="#collections" className="nx-btn nx-btn-ghost">
              {ctaSecondary}
            </Link>
          </motion.div>

          <motion.div className="nx-hero2-proof" {...enter(0.8)}>
            <span className="nx-avatars" aria-hidden>
              <Image src={fashionSrc("men avatar one", 72, 72)} alt="" width={36} height={36} />
              <Image src={fashionSrc("men avatar two suit", 72, 72)} alt="" width={36} height={36} />
              <Image src={fashionSrc("men avatar three shirt", 72, 72)} alt="" width={36} height={36} />
            </span>
            <span className="nx-hero2-stat">
              <span className="nx-stars" aria-hidden>
                {"★★★★★".split("").map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </span>
              <small>
                <strong>4.9/5</strong> from 25K+ shoppers
              </small>
            </span>
          </motion.div>

          <motion.ul className="nx-hero2-trust" {...enter(0.92)}>
            {TRUST.map((t) => (
              <li key={t.label}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.d} />
                </svg>
                {t.label}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="nx-hero2-right">
          <Parallax range={36}>
            <NexaHeroShowcase />
          </Parallax>

          <motion.div className="nx-hero-social nx-hero2-social" {...enter(0.95)}>
            {SOCIALS.map((s) => (
              <a key={s.label} href="#" aria-label={s.label}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#collections"
        className="nx-hero2-scroll"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.3, ease: EASE }}
        aria-label="Scroll to collections"
      >
        <span>Scroll</span>
        <span className="nx-hero2-scroll-line" aria-hidden />
      </motion.a>
    </section>
  );
}
