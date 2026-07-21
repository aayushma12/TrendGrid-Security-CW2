"use client";

/**
 * TrendingScatter — the "Trending Now" band.
 *
 * The four cards start as a stacked deck and deal / shuffle out into the fan as
 * the section travels through the viewport. The motion is scroll-linked and
 * driven entirely in JS: a rAF loop (running only while the band is in view)
 * reads the section's position each frame, derives a 0 -> 1 progress, and writes
 * each card's transform directly. Scroll back up and the deck restacks.
 * Reduced motion shows the final fan with no scroll linkage.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { fashionSrc } from "@/lib/fashion-images";
import { TRENDING_CARDS } from "@/lib/shop-data";

/* Fan geometry per card index. x/y are in rem, r in deg, s is scale. */
const POS = [
  { xr: -9,  yr: -4.5, r: -9, s: 0.98, scroll: 42,  pointer: 16, handle: "@maker" },
  { xr: 6.5, yr: -7,   r: 8,  s: 0.86, scroll: -32, pointer: 12 },
  { xr: -7,  yr: 7.5,  r: -5, s: 0.9,  scroll: 30,  pointer: 14, tone: "gold" as const },
  { xr: 9.5, yr: 5.5,  r: 10, s: 0.96, scroll: -38, pointer: 18, handle: "@gallery" },
];

/* Deck rest pose for card i (px / deg / scale). */
const deck = (i: number) => ({ x: i * 4, y: i * -5, r: (i - 1.5) * 2.2, s: 0.82 });
const smooth = (t: number) => t * t * (3 - 2 * t); // smoothstep easing

export function TrendingScatter() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = Array.from(
      el.querySelectorAll<HTMLElement>(".trend-scatter__card"),
    );
    if (!cards.length) return;

    let remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    let mobile = window.matchMedia("(max-width: 900px)").matches;

    // Place a single card at progress p (0 = deck, 1 = fan).
    const place = (card: HTMLElement, i: number, p: number) => {
      const pi = smooth(Math.min(1, Math.max(0, (p - (3 - i) * 0.14) / 0.5)));
      const d = deck(i);
      const fx = POS[i].xr * remPx * (mobile ? 0.6 : 1);
      const fy = POS[i].yr * remPx * (mobile ? 0.78 : 1);
      const tx = d.x + (fx - d.x) * pi;
      const ty = d.y + (fy - d.y) * pi;
      const rot = d.r + (POS[i].r - d.r) * pi;
      const sc = d.s + (POS[i].s - d.s) * pi;
      card.style.transform =
        `translate(-50%, -50%) translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc})`;
      card.style.opacity = String(0.25 + 0.75 * pi);
    };

    // Reduced motion: snap to the finished fan, no scroll loop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      cards.forEach((card, i) => place(card, i, 1));
      return;
    }

    const progress = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const lo = vh * 0.92;
      const hi = vh * 0.4;
      return Math.min(1, Math.max(0, (lo - rect.top) / (lo - hi)));
    };

    const frame = () => {
      const p = progress();
      cards.forEach((card, i) => place(card, i, p));
    };

    let active = false;
    let raf = 0;
    const loop = () => {
      frame();
      raf = requestAnimationFrame(loop);
    };
    const startLoop = () => {
      if (!active) {
        active = true;
        loop();
      }
    };
    const stopLoop = () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // Run the loop only while the band is on screen.
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            startLoop();
          } else {
            stopLoop();
          }
        });
      },
      { threshold: 0, rootMargin: "100px 0px" },
    );
    obs.observe(el);

    const onResize = () => {
      remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      mobile = window.matchMedia("(max-width: 900px)").matches;
      frame();
    };
    window.addEventListener("resize", onResize);
    frame(); // initial paint

    return () => {
      obs.disconnect();
      stopLoop();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section ref={ref} className="trend-scatter" aria-labelledby="trend-title">
      <div className="container trend-scatter__inner">
        <div className="trend-scatter__copy">
          <p className="eyebrow">Trending Now</p>
          <h2 id="trend-title" className="section-title trend-scatter__title">
            Stories from <span className="trend-scatter__title-accent">the collection.</span>
          </h2>
          <p className="trend-scatter__lead">
            The pieces our community can&rsquo;t stop talking about &mdash; new
            arrivals, editor&rsquo;s picks and limited drops, gathered in one
            living wall.
          </p>
          <Link href="/shop" className="btn btn--primary btn--lg">
            Browse what&rsquo;s trending
          </Link>
        </div>

        <div className="trend-scatter__stage">
          {TRENDING_CARDS.slice(0, 4).map((c, i) => {
            const p = POS[i];
            return (
              <figure
                key={c.title}
                className={`trend-scatter__card${p.tone ? ` is-${p.tone}` : ""}`}
                style={{ "--i": String(i) } as React.CSSProperties}
              >
                <div className="trend-scatter__float">
                  <Link
                    href={c.href}
                    className="trend-scatter__drift"
                    data-parallax={p.scroll}
                    data-parallax-pointer={p.pointer}
                  >
                    <Image
                      src={fashionSrc(c.seed, 420, 540)}
                      alt={c.title}
                      fill
                      sizes="(max-width:900px) 45vw, 220px"
                      className="trend-scatter__img"
                    />
                    <span className="trend-scatter__cap">
                      <span className="trend-scatter__tag">{c.tag}</span>
                      <span className="trend-scatter__name">{c.title}</span>
                      <span className="trend-scatter__story">{c.story}</span>
                    </span>
                    {p.handle ? (
                      <span className="trend-scatter__handle">{p.handle}</span>
                    ) : null}
                  </Link>
                </div>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
