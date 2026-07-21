"use client";

/**
 * Homepage motion layer.
 *
 * Lively, e-commerce-flavoured micro-interactions used by the storefront home
 * page: animated count-up stats, a scroll-driven parallax mount, and a live
 * countdown timer for the "Deals of the Day" section. Everything honours
 * prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------- count-up stat */

export function CountUp({
  end,
  duration = 1600,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced()) {
      setValue(end);
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        // easeOutExpo for a snappy, premium settle
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setValue(end * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/* --------------------------------------------------------------- parallax mount */

/**
 * Mount once. Translates any element carrying `data-parallax` (a number = px of
 * travel across the viewport) as the page scrolls. Pointer-driven drift is
 * added to elements carrying `data-parallax-pointer`.
 */
export function ParallaxMount() {
  useEffect(() => {
    if (prefersReduced()) return;

    const scrollEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]"),
    );
    const pointerEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax-pointer]"),
    );

    let ticking = false;

    const applyScroll = () => {
      const vh = window.innerHeight;
      scrollEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0");
        const rect = el.getBoundingClientRect();
        // progress: -1 (below viewport) .. 1 (above viewport)
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        el.style.setProperty("--py", `${(-progress * speed).toFixed(2)}px`);
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyScroll);
      }
    };

    const onPointer = (e: PointerEvent) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      pointerEls.forEach((el) => {
        const depth = parseFloat(el.dataset.parallaxPointer || "0");
        el.style.setProperty("--px", `${(cx * depth).toFixed(2)}px`);
        el.style.setProperty("--pyp", `${(cy * depth).toFixed(2)}px`);
      });
    };

    applyScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", applyScroll);
    if (pointerEls.length) window.addEventListener("pointermove", onPointer);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", applyScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return null;
}

/* ------------------------------------------------------------- countdown timer */

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Live ticking countdown. `hours` sets how far out the deadline is from first
 * mount (kept in a ref so it stays stable across re-renders).
 */
export function CountdownTimer({ hours = 8 }: { hours?: number }) {
  const deadline = useRef<number>(Date.now() + hours * 3600 * 1000);
  const [remaining, setRemaining] = useState(hours * 3600 * 1000);

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(deadline.current - Date.now(), 0);
      setRemaining(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const cells: [string, string][] = [
    [pad(h), "Hrs"],
    [pad(m), "Min"],
    [pad(s), "Sec"],
  ];

  return (
    <div className="pcard__timer pcard__timer--live" aria-label="Time remaining">
      {cells.map(([val, label], i) => (
        <span key={label} className="countdown-cell" style={{ animationDelay: `${i * 0.12}s` }}>
          {val}
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}
