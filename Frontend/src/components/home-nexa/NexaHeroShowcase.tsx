"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fashionSrc } from "@/lib/fashion-images";
import { getProduct, discountPct, formatPrice } from "@/lib/shop-data";
import { EASE, Float } from "./motion";

/* Trending offers surfaced in the hero — deep discounts, garment variety. */
const OFFER_IDS = [
  "trendy-brown-coat",
  "stylist-dress",
  "brown-winter-coat",
  "leather-hand-bag",
  "classic-gold-watch",
];

const SLIDES = OFFER_IDS.map((id) => getProduct(id)).filter(
  (p): p is NonNullable<typeof p> => Boolean(p)
);

const ROTATE_MS = 4200;

/**
 * Hero image showcase — an auto-rotating gallery of trending offers.
 * Each slide crossfades with a slow Ken-Burns drift; a live badge shows the
 * discount, price and rating, and a "Shop this" link deep-links to the PDP.
 * A thumbnail rail lets shoppers jump to any offer. Pauses on hover / focus,
 * auto-advance disabled under prefers-reduced-motion.
 */
export function NexaHeroShowcase() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length),
    []
  );
  const jump = useCallback((i: number) => setIndex(i), []);

  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [reduce, paused, index]);

  const p = SLIDES[index];
  if (!p) return null;
  const off = discountPct(p);

  return (
    <motion.div
      className="nx-showcase"
      initial={reduce ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.25, ease: EASE }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <span className="nx-hero2-blob" aria-hidden />

      <motion.div
        className="nx-hero2-photo nx-showcase-stage"
        initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0% round 28px)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 28px)" }}
        transition={{ duration: 1.25, delay: 0.35, ease: EASE }}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={p.id}
            className="nx-showcase-slide"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.8, ease: EASE },
              scale: { duration: ROTATE_MS / 1000 + 1, ease: "linear" },
            }}
          >
            <Image
              src={fashionSrc(p.name, 880, 1100)}
              alt={p.name}
              width={880}
              height={1100}
              priority={index === 0}
            />
          </motion.div>
        </AnimatePresence>

        <span className="nx-showcase-scrim" aria-hidden />
        <span className="nx-hero2-frame" aria-hidden />
        <span className="nx-hero2-tick tl" aria-hidden />
        <span className="nx-hero2-tick tr" aria-hidden />
        <span className="nx-hero2-tick bl" aria-hidden />
        <span className="nx-hero2-tick br" aria-hidden />

        {/* discount badge */}
        {off > 0 && (
          <AnimatePresence mode="wait">
            <motion.span
              key={p.id}
              className="nx-showcase-badge"
              initial={reduce ? false : { opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -6 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <strong>-{off}%</strong>
              <small>OFF</small>
            </motion.span>
          </AnimatePresence>
        )}

        {/* offer info overlay */}
        <div className="nx-showcase-info">
          <AnimatePresence mode="wait">
            <motion.div
              key={p.id}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <span className="nx-showcase-cat">
                <span className="nx-showcase-rate" aria-hidden>★ {p.rating.toFixed(1)}</span>
                {p.category}
              </span>
              <h3 className="nx-showcase-name">{p.name}</h3>
              <div className="nx-showcase-buy">
                <span className="nx-showcase-price">
                  {formatPrice(p.price)}
                  {p.compareAtPrice > p.price && (
                    <s>{formatPrice(p.compareAtPrice)}</s>
                  )}
                </span>
                <Link href={`/shop/${p.id}`} className="nx-showcase-shop">
                  Shop this
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* prev / next controls */}
        <button className="nx-showcase-nav is-prev" onClick={() => go(-1)} aria-label="Previous offer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="nx-showcase-nav is-next" onClick={() => go(1)} aria-label="Next offer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </motion.div>

      {/* rotating brand seal */}
      <motion.div
        className="nx-hero2-seal"
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 1.1, ease: EASE }}
        aria-hidden
      >
        <div className={reduce ? "nx-seal-ring" : "nx-seal-ring is-spin"}>
          <svg viewBox="0 0 120 120" width="104" height="104">
            <defs>
              <path id="nx-seal-path" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
            </defs>
            <text className="nx-seal-text">
              <textPath href="#nx-seal-path" startOffset="0">
                PREMIUM QUALITY · CRAFTED SINCE 2026 ·
              </textPath>
            </text>
          </svg>
        </div>
        <span className="nx-seal-mark">✦</span>
      </motion.div>

      <Float amount={7} duration={5.2} className="nx-hero2-chip is-bottom">
        <span className="nx-chip">
          <span className="nx-chip-icon is-check" aria-hidden>✓</span>
          Ethically Made · Premium Fabrics
        </span>
      </Float>

      {/* thumbnail rail */}
      <div className="nx-showcase-thumbs" role="tablist" aria-label="Trending offers">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            className={i === index ? "nx-showcase-thumb is-active" : "nx-showcase-thumb"}
            onClick={() => jump(i)}
            role="tab"
            aria-selected={i === index}
            aria-label={`${s.name} — ${discountPct(s)}% off`}
          >
            <Image src={fashionSrc(s.name, 120, 150)} alt="" width={48} height={60} />
            {i === index && !reduce && (
              <motion.span
                className="nx-showcase-thumb-bar"
                key={`bar-${index}-${paused}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: paused ? 0 : 1 }}
                transition={{ duration: paused ? 0 : ROTATE_MS / 1000, ease: "linear" }}
                aria-hidden
              />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
