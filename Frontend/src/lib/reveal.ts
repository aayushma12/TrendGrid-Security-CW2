/**
 * Scroll-reveal system (Section 5).
 *
 * Drives the `.is-in` class on every `.lux-reveal` element via a single shared
 * IntersectionObserver, animates `.lux-count` stat counters, and exposes a
 * re-observe helper for dynamically appended content (e.g. "Load more").
 *
 * The observer instance is cached on `window._revealObserver` so callers can
 * re-observe new nodes after route changes / pagination.
 */

declare global {
  interface Window {
    _revealObserver?: IntersectionObserver;
  }
}

const REDUCED = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Count a `.lux-count[data-target]` element up from 0. */
function animateCounter(el: HTMLElement) {
  if (el.dataset.counted === "true") return;
  el.dataset.counted = "true";

  const target = Number(el.dataset.target ?? el.textContent?.replace(/[^\d.]/g, "") ?? 0);
  if (!Number.isFinite(target) || target === 0) return;

  if (REDUCED()) {
    el.textContent = target.toLocaleString();
    return;
  }

  const duration = 1200;
  const start = performance.now();
  const suffix = el.dataset.suffix ?? "";
  const prefix = el.dataset.prefix ?? "";

  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const value = Math.round(target * easeOutCubic(p));
    el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Reveal a single element and fire any counters inside it. */
function reveal(el: Element) {
  el.classList.add("is-in");
  el.querySelectorAll<HTMLElement>(".lux-count").forEach(animateCounter);
  if (el.matches(".lux-count")) animateCounter(el as HTMLElement);
}

/**
 * Initialise (or re-run) the reveal observer. Safe to call on every route
 * change — already-revealed elements are skipped.
 */
export function initReveal(): IntersectionObserver | undefined {
  if (typeof window === "undefined") return;

  if (REDUCED()) {
    document.querySelectorAll(".lux-reveal").forEach((el) => reveal(el));
    return;
  }

  // reuse a single observer across calls
  let io = window._revealObserver;
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io!.unobserve(entry.target); // fire once only
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    window._revealObserver = io;
  }

  document
    .querySelectorAll(".lux-reveal:not(.lux-observed)")
    .forEach((el) => {
      el.classList.add("lux-observed");
      io!.observe(el);
    });

  return io;
}

/**
 * Mark freshly appended product cards as reveal targets and observe them.
 * Used after "Load more" appends new `.pcard` nodes.
 */
export function reobserveCards() {
  if (typeof window === "undefined") return;
  const io = window._revealObserver;
  document
    .querySelectorAll(".pgrid .pcard:not(.lux-observed)")
    .forEach((el) => {
      el.classList.add("lux-reveal", "lux-observed");
      if (REDUCED()) reveal(el);
      else io?.observe(el);
    });
}
