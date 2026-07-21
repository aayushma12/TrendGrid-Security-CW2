"use client";

/**
 * Page transition + route progress (Section 3).
 *
 * <PageTransition> wraps the page content as a sibling of the header/pdpbar so
 * it never interferes with the sticky header backdrop-filter or the mobile
 * purchase bar. It re-triggers the enter animation and re-runs the scroll-reveal
 * observer on every pathname change.
 *
 * <RouteProgress> renders the thin top progress bar. App Router has no
 * routeChange events, so we start the bar on internal-link clicks and finish it
 * when the pathname actually changes.
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { initReveal } from "@/lib/reveal";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.classList.remove("page-transition-enter");
      void el.offsetHeight; // force reflow to restart the animation
      el.classList.add("page-transition-enter");
    }
    // re-run reveal after the new route's DOM is in place
    const id = requestAnimationFrame(() => initReveal());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div ref={ref} className="page-transition-enter">
      {children}
    </div>
  );
}

export function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const loadingRef = useRef(false);

  // Start the bar when an internal link is clicked.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || href.startsWith("#") || href.startsWith("http") || target === "_blank") return;
      if (href === pathname) return;
      loadingRef.current = true;
      setPhase("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  // Finish the bar when the pathname changes.
  useEffect(() => {
    if (!loadingRef.current) return;
    loadingRef.current = false;
    setPhase("done");
    const id = setTimeout(() => setPhase("idle"), 600);
    return () => clearTimeout(id);
  }, [pathname]);

  return (
    <div
      className={`route-progress${phase === "loading" ? " is-loading" : ""}${phase === "done" ? " is-done" : ""}`}
      aria-hidden
    />
  );
}
