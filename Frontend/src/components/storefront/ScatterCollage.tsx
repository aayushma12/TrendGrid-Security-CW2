"use client";

/**
 * ScatterCollage — scroll-driven "fan-out collage" lookbook band.
 *
 * Adapted from the Pallet Ross website-animation concept (a marketplace landing
 * where cards start clustered in the centre and scatter / fan out as the visitor
 * scrolls). Re-themed here as an editorial fashion lookbook.
 *
 * Motion is powered by the shared scroll engine: `useScrollProgress` writes a
 * single `--p` (0 → 1) onto the section, and every per-card transform is
 * interpolated from that one variable in CSS (see collage.css). The card stage
 * is marked `[data-scroll-track]` so the scatter plays while the cards are
 * actually on screen. Reduced motion is handled by the hook (locks --p to 1).
 */

import Image from "next/image";
import Link from "next/link";
import { fashionSrc } from "@/lib/fashion-images";
import { useScrollProgress } from "@/lib/useScrollProgress";

type Card = {
  seed: string;
  label: string;
  tag: string;
  /** Scattered-target transform (applied at progress = 1). */
  x: string;
  y: string;
  r: string;
  s: number;
  /** Stacking order. */
  z: number;
  /** Optional floating @handle bubble. */
  handle?: string;
  tone?: "gold" | "ink" | "ivory";
};

/* Seven editorial cards fanning out left -> right, mirroring the reference reel. */
const CARDS: Card[] = [
  { seed: "editorial-chapter-one", label: "The Tailoring Edit", tag: "Outerwear", x: "-30rem", y: "1.5rem",  r: "-13deg", s: 1.0,  z: 1, handle: "@studio" },
  { seed: "lookbook-knitwear",     label: "Soft Structure",     tag: "Knitwear",  x: "-19.5rem", y: "5.5rem", r: "-7deg",  s: 1.04, z: 2 },
  { seed: "dress-evening-muse",    label: "Evening Muse",       tag: "Dresses",   x: "-9rem",   y: "8.5rem",  r: "-2deg",  s: 1.08, z: 3, handle: "@atelier", tone: "gold" },
  { seed: "hero-fashion-center",   label: "Summer 2026",        tag: "Featured",  x: "0rem",    y: "9.5rem",  r: "0deg",   s: 1.14, z: 6 },
  { seed: "suit-modern-line",      label: "Modern Line",        tag: "Suiting",   x: "9rem",    y: "8.5rem",  r: "2deg",   s: 1.08, z: 3, tone: "ink" },
  { seed: "coat-camel-icon",       label: "The Camel Coat",     tag: "Icons",     x: "19.5rem", y: "5.5rem",  r: "7deg",   s: 1.04, z: 2, handle: "@howard" },
  { seed: "accessories-still",     label: "Finishing Touch",    tag: "Accessories", x: "30rem", y: "1.5rem",  r: "13deg",  s: 1.0,  z: 1 },
];

export function ScatterCollage() {
  const rootRef = useScrollProgress<HTMLElement>({ start: 0.95, end: 0.28 });

  return (
    <section
      ref={rootRef}
      className="lux-collage"
      aria-labelledby="collage-heading"
    >
      <div className="container lux-collage__inner">
        <header className="lux-collage__head">
          <p className="eyebrow">The Lookbook</p>
          <h2 id="collage-heading" className="section-title lux-collage__title">
            <span>Every piece tells</span>{" "}
            <span className="lux-collage__title-accent">a story.</span>
          </h2>
          <p className="lux-collage__lead">
            Scroll to watch the season unfold &mdash; a curated spread of the looks,
            fabrics and finishing touches that define Summer 2026.
          </p>
          <Link href="/shop" className="btn btn--primary btn--lg lux-collage__cta">
            Explore the collection
          </Link>
        </header>

        <div className="lux-collage__stage" data-scroll-track>
          {CARDS.map((c, i) => (
            <figure
              key={c.seed}
              className={`lux-collage__card${c.tone ? ` is-${c.tone}` : ""}`}
              style={
                {
                  "--x": c.x,
                  "--y": c.y,
                  "--r": c.r,
                  "--s": String(c.s),
                  "--z": String(c.z),
                  "--i": String(i),
                } as React.CSSProperties
              }
            >
              <Image
                src={fashionSrc(c.seed, 520, 680)}
                alt={c.label}
                fill
                sizes="(max-width:768px) 60vw, 260px"
                className="lux-collage__img"
              />
              <figcaption className="lux-collage__caption">
                <span className="lux-collage__cardtag">{c.tag}</span>
                <span className="lux-collage__cardname">{c.label}</span>
              </figcaption>
              {c.handle ? (
                <span className="lux-collage__handle" aria-hidden>
                  {c.handle}
                </span>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
