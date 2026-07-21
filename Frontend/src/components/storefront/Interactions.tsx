"use client";

/**
 * Micro-interaction layer (Section 9).
 *
 * Tactile components + helpers: wishlist heart toggle, add-to-cart confirmation,
 * quantity stepper feedback, size-button ripple, toast stack, scroll-to-top, and
 * form validation helpers. All animations respect prefers-reduced-motion (the
 * CSS guards in shop.css disable the keyframes).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store-context";

/**
 * Legacy shape from the pre-variant mock cart. This component (and every
 * caller of it, e.g. TopSellerTabs) is not wired into any live route — the
 * real storefront's add-to-cart goes through `useStore().addToCart(variantId, qty)`
 * against the actual product variant. Kept type-safe here only so this
 * still-unwired preview UI continues to compile.
 */
export interface AddToCartInput {
  id: string;
  name: string;
  price: number;
  color?: string;
  size?: string;
  qty?: number;
  image?: string;
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------ imperative helpers */

/** Brief scale + flash on a quantity +/- button. */
export function qtyHaptic(btn: HTMLElement) {
  if (reduced()) return;
  btn.animate(
    [
      { transform: "scale(0.88)", background: "var(--color-surface-elevated)" },
      { transform: "scale(1)", background: "transparent" },
    ],
    { duration: 180, easing: "ease-out" },
  );
}

/** Shake a `.qty` wrapper (e.g. when qty would drop below 1). */
export function shakeQty(wrapper: HTMLElement | null) {
  if (!wrapper || reduced()) return;
  wrapper.classList.remove("is-shaking");
  void wrapper.offsetWidth; // reflow to restart animation
  wrapper.classList.add("is-shaking");
  setTimeout(() => wrapper.classList.remove("is-shaking"), 320);
}

/** Spawn a ripple inside a `.size-btn` at click position. */
export function spawnRipple(btn: HTMLElement) {
  if (reduced()) return;
  const r = document.createElement("span");
  r.className = "ripple";
  btn.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

/* ------------------------------------------------------------ wishlist heart */

export function WishlistButton({
  id,
  name,
  className = "icon-btn icon-btn--sm",
  size = 14,
}: {
  id: string;
  name?: string;
  className?: string;
  size?: number;
}) {
  const { isWishlisted, toggleWishlist, showToast } = useStore();
  const ref = useRef<HTMLButtonElement>(null);
  const active = isWishlisted(id);

  const onClick = () => {
    const added = toggleWishlist(id);
    showToast(added ? "Saved to wishlist" : "Removed from wishlist");
    const btn = ref.current;
    if (btn && !reduced()) {
      btn.style.animation = "heartPop 0.4s var(--lux-ease) both";
      setTimeout(() => {
        btn.style.animation = "";
      }, 400);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`${className} wishlist-btn${active ? " is-wishlisted" : ""}`}
      aria-pressed={active}
      aria-label={active ? `Remove ${name ?? "item"} from wishlist` : `Add ${name ?? "item"} to wishlist`}
      onClick={onClick}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

/* ----------------------------------------------------- add-to-cart with confirm */

export function AddToCartButton({
  item,
  className = "btn btn--primary",
  children = "Add to cart",
  openDrawer = true,
  toast = true,
}: {
  item: AddToCartInput;
  className?: string;
  children?: ReactNode;
  openDrawer?: boolean;
  toast?: boolean;
}) {
  const { openCart, showToast } = useStore();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // This legacy preview button isn't wired to the real cart (no variantId
  // available from `item`'s mock shape) — it only drives the UI feedback.
  const onClick = () => {
    void item;
    if (openDrawer) openCart();
    if (toast) showToast("Added to cart");
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <button
      type="button"
      className={`${className}${added ? " is-added" : ""}`}
      onClick={onClick}
    >
      {added ? "Added ✓" : children}
    </button>
  );
}

/* --------------------------------------------------------------- toast stack */

function ToastItem({ id, msg, duration }: { id: number; msg: string; duration: number }) {
  const { dismissToast } = useStore();
  const [out, setOut] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setOut(true), duration);
    const remove = setTimeout(() => dismissToast(id), duration + 250);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [id, duration, dismissToast]);

  return <div className={`toast${out ? " is-out" : ""}`} role="status">{msg}</div>;
}

export function ToastStack() {
  const { toasts } = useStore();
  return (
    <div className="toast-stack" id="toastStack" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} msg={t.msg} duration={t.duration} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ scroll to top */

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`scroll-top${visible ? " is-visible" : ""}`}
      id="scrollTop"
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑
    </button>
  );
}

/* ------------------------------------------------------- form validation hook */

export type Validator = (value: string) => boolean;

export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  required: (v: string) => v.trim().length > 0,
};

/** Attach to an <input className="input">: validates on blur, clears on input. */
export function useFieldValidation(validate: Validator) {
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    el.classList.remove("is-error", "is-success");
    if (!el.value) return;
    el.classList.add(validate(el.value) ? "is-success" : "is-error");
  };
  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.classList.remove("is-error");
  };
  return { onBlur, onInput };
}
