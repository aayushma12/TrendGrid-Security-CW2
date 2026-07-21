"use client";

/**
 * useScrollProgress — the shared scroll-motion engine.
 * ----------------------------------------------------------------------------
 * Drives a single `--p` CSS variable (0 → 1) onto a root element from the
 * scroll position, so any descendant can animate purely in CSS via `var(--p)`.
 * This is the structured foundation reused by every scroll-driven visualisation
 * in the storefront (the lookbook collage, the stats band, …).
 *
 * Design goals
 *  • One source of truth: every scene maps its motion off the same `--p`.
 *  • Cheap: one rAF-throttled scroll listener, one style write per frame, and
 *    React never re-renders during the animation.
 *  • Honest triggering: progress is measured from the element marked
 *    `[data-scroll-track]` inside the root (falls back to the root), so the
 *    animation can be tied to the visual the visitor actually sees rather than
 *    a tall wrapper whose top scrolls past long before the content appears.
 *  • Accessible: prefers-reduced-motion locks `--p` to 1 (final, static state).
 *
 * Usage
 *   const rootRef = useScrollProgress<HTMLElement>({ start: 0.95, end: 0.28 });
 *   return <section ref={rootRef}><div data-scroll-track>…</div></section>;
 */

import { useEffect, useRef } from "react";

export type ScrollProgressOptions = {
  /** Viewport fraction (0..1) of the track's top where progress = 0. Default 0.95 (just entered at the bottom). */
  start?: number;
  /** Viewport fraction (0..1) of the track's top where progress = 1. Default 0.28 (settled near the top). */
  end?: number;
  /** Optional per-frame callback with progress (0..1). Do DOM work here — never setState (it would re-render every frame). */
  onProgress?: (p: number) => void;
};

export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  options: ScrollProgressOptions = {},
) {
  const rootRef = useRef<T>(null);
  // keep latest options without re-running the effect
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // signal CSS that JS has taken over (see the `:not(.is-ready)` fallbacks)
    root.classList.add("is-ready");

    const track =
      root.querySelector<HTMLElement>("[data-scroll-track]") ?? root;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--p", "1");
      optsRef.current.onProgress?.(1);
      return;
    }

    let ticking = false;

    const update = () => {
      ticking = false;
      const { start = 0.95, end = 0.28 } = optsRef.current;
      const vh = window.innerHeight;
      const top = track.getBoundingClientRect().top;
      const raw = (vh * start - top) / (vh * start - vh * end);
      const p = Math.max(0, Math.min(1, raw));
      root.style.setProperty("--p", p.toFixed(4));
      optsRef.current.onProgress?.(p);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    // run now and again after first paint (images/fonts can shift the track)
    update();
    requestAnimationFrame(update);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return rootRef;
}
