"use client";

/**
 * HeroArtScatter — the art-marketplace hero.
 *
 * A model in an editorial dress anchors the centre; a spread of "art" cards
 * flies out on load, then keeps living: each card gently floats forever, drifts
 * with scroll + pointer, and lifts/zooms on hover.
 *
 * Three independent transform layers keep every motion clean (none fight):
 *   1. `.art-hero__card`  — INTRO scatter + blur-in (CSS transition, .is-in).
 *   2. `.art-hero__float` — perpetual idle bob (CSS keyframe, staggered by --i).
 *   3. `.art-hero__drift` — scroll + pointer parallax (global ParallaxMount sets
 *      --px/--py/--pyp). Hover effects target box-shadow + the image, which do
 *      not collide with any of the transform layers.
 *
 * prefers-reduced-motion shows the final layout instantly with no movement.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { fashionSrc } from "@/lib/fashion-images";

type Art = {
  seed: string;
  label: string;
  tag: string;
  x: string;
  y: string;
  r: string;
  s: number;
  z: number;
  scroll: number;
  pointer: number;
  handle?: string;
  tone?: "gold" | "ink";
};

const ARTS: Art[] = [
  { seed: "art-editorial-bloom",  label: "Bloom No.3",      tag: "Painting",   x: "-15rem", y: "-6.5rem", r: "-12deg", s: 0.82, z: 2, scroll: 46, pointer: 20, handle: "@studio" },
  { seed: "art-portrait-muse",    label: "Muse",            tag: "Portrait",   x: "-12.5rem", y: "5.5rem", r: "-7deg",  s: 0.95, z: 3, scroll: -34, pointer: 14 },
  { seed: "art-collage-press",    label: "Pressed Petals",  tag: "Collage",    x: "-5.5rem", y: "10rem",  r: "-3deg",  s: 0.8,  z: 2, scroll: 30, pointer: 10 },
  { seed: "art-abstract-field",   label: "Field Study",     tag: "Abstract",   x: "7.5rem",  y: "9rem",   r: "6deg",   s: 0.86, z: 3, scroll: -40, pointer: 16, handle: "@robin", tone: "gold" },
  { seed: "art-sculpture-form",   label: "Form II",         tag: "Sculpture",  x: "14rem",   y: "-1rem",  r: "11deg",  s: 0.82, z: 2, scroll: 38, pointer: 22 },
  { seed: "art-print-bold",       label: "Bold Print",      tag: "Print",      x: "10rem",   y: "-9rem",  r: "8deg",   s: 0.76, z: 1, scroll: -28, pointer: 12, tone: "ink" },
  { seed: "art-mixed-media",      label: "Mixed Media",     tag: "Mixed",      x: "-2.5rem", y: "-11rem", r: "-4deg",  s: 0.72, z: 1, scroll: 24, pointer: 8 },
];

export function HeroArtScatter() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => el.classList.add("is-in"));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={ref} className="art-hero" aria-labelledby="art-hero-title">
      <span className="art-hero__glow art-hero__glow--a" aria-hidden />
      <span className="art-hero__glow art-hero__glow--b" aria-hidden />

      <div className="container art-hero__inner">
        <div className="art-hero__copy">
          <p className="art-hero__eyebrow">
            <span className="art-hero__dot" aria-hidden /> The creative marketplace
          </p>
          <h1 id="art-hero-title" className="art-hero__title">
            <span>Showcase, Sell,</span>
            <span className="art-hero__title-accent">&amp; acquire arts</span>
            <span>to our marketplace.</span>
          </h1>
          <p className="art-hero__lead">
            A living community where artists and collectors meet &mdash; discover
            original pieces, follow your favourite makers, and build a collection
            you love.
          </p>
          <div className="art-hero__cta">
            <Link href="/shop" className="btn btn--primary btn--lg">
              Explore the marketplace
            </Link>
            <Link href="/shop" className="btn btn--outline btn--lg">
              Start selling
            </Link>
          </div>
          <div className="art-hero__meta">
            <span><strong>12k+</strong> artists</span>
            <span className="art-hero__metaDot" aria-hidden />
            <span><strong>80k+</strong> original works</span>
            <span className="art-hero__metaDot" aria-hidden />
            <span>New drops daily</span>
          </div>
        </div>

        <div className="art-hero__stage" aria-hidden={false}>
          {/* central model */}
          <figure className="art-hero__model">
            <div className="art-hero__float">
              <div
                className="art-hero__drift"
                data-parallax="22"
                data-parallax-pointer="-12"
              >
                <Image
                  src={fashionSrc("hero-dress-editorial-muse", 720, 900)}
                  alt="Featured artist wearing a designer dress"
                  fill
                  priority
                  sizes="(max-width:900px) 80vw, 420px"
                  className="art-hero__img"
                />
                <span className="art-hero__modelTag">
                  <span className="art-hero__modelTag-dot" aria-hidden />
                  Featured · @amara
                </span>
              </div>
            </div>
          </figure>

          {/* scattered art cards */}
          {ARTS.map((a, i) => (
            <figure
              key={a.seed}
              className={`art-hero__card${a.tone ? ` is-${a.tone}` : ""}`}
              style={
                {
                  "--x": a.x,
                  "--y": a.y,
                  "--r": a.r,
                  "--s": String(a.s),
                  "--z": String(a.z),
                  "--i": String(i),
                } as React.CSSProperties
              }
            >
              <div className="art-hero__float">
                <div
                  className="art-hero__drift"
                  data-parallax={a.scroll}
                  data-parallax-pointer={a.pointer}
                >
                  <Image
                    src={fashionSrc(a.seed, 360, 460)}
                    alt={a.label}
                    fill
                    sizes="(max-width:900px) 40vw, 190px"
                    className="art-hero__img"
                  />
                  <figcaption className="art-hero__cardcap">
                    <span className="art-hero__cardtag">{a.tag}</span>
                    <span className="art-hero__cardname">{a.label}</span>
                  </figcaption>
                  {a.handle ? (
                    <span className="art-hero__handle">{a.handle}</span>
                  ) : null}
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>

      <span className="art-hero__scroll" aria-hidden>
        <span>Scroll to explore</span>
        <i />
      </span>
    </section>
  );
}
