"use client";

/**
 * Global Nexa chrome — mounted once in the (shop) layout.
 * Cart drawer, search overlay, toast stack, scroll-to-top, route progress,
 * and the Cmd/Ctrl+K search shortcut.
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type Toast } from "@/lib/store-context";
import { RouteProgress } from "@/components/storefront/PageTransition";
import { NexaCartDrawer } from "./NexaCartDrawer";
import { NexaSearch } from "./NexaSearch";
import { EASE } from "./motion";

/** Auto-dismisses itself after `toast.duration` (never more than 5s), so
 *  toasts don't pile up when several fire back to back (login/logout/cart).
 *  `dismiss` is built here (not passed as an inline arrow from the parent) so
 *  its identity stays stable across re-renders — otherwise every new toast
 *  arriving would reset every *other* toast's timer via the effect below. */
function NexaToast({ toast, dismissToast }: { toast: Toast; dismissToast: (id: number) => void }) {
  const dismiss = useCallback(() => dismissToast(toast.id), [dismissToast, toast.id]);

  useEffect(() => {
    const ms = Math.min(toast.duration || 2800, 5000);
    const id = window.setTimeout(dismiss, ms);
    return () => window.clearTimeout(id);
  }, [toast.duration, dismiss]);

  return (
    <motion.button
      className="nx-toast"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.3, ease: EASE }}
      onClick={dismiss}
    >
      {toast.msg}
    </motion.button>
  );
}

function NexaToasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="nx nx-toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            className="nx-toast"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={() => dismissToast(t.id)}
          >
            <span className="nx-toast-ic" aria-hidden>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="nx-toast-msg">{t.msg}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

function NexaScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          className="nx nx-scrolltop"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.25, ease: EASE }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function NexaChrome() {
  const { openSearch, searchOpen } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!searchOpen) openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch, searchOpen]);

  return (
    <>
      <RouteProgress />
      <NexaCartDrawer />
      <NexaSearch />
      <NexaToasts />
      <NexaScrollTop />
    </>
  );
}
