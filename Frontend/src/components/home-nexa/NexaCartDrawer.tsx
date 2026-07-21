"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { resolveImage } from "@/lib/fashion-images";
import { useStore } from "@/lib/store-context";
import { formatPrice, STORE } from "@/lib/shop-data";
import { EASE } from "./motion";

/** Slide-in cart drawer in the Nexa theme. Driven by store-context (server-backed cart). */
export function NexaCartDrawer() {
  const { lines, count, subtotal, cartOpen, closeCart, updateQty, removeItem, cartLoading } =
    useStore();
  const toFree = STORE.freeShippingOver - subtotal;
  const freePct = Math.min(100, Math.round((subtotal / STORE.freeShippingOver) * 100));

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, closeCart]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div
          className="nx nx-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeCart}
        >
          <motion.aside
            className="nx-drawer"
            initial={{ x: "104%" }}
            animate={{ x: 0 }}
            exit={{ x: "104%" }}
            transition={{ duration: 0.42, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="nx-drawer-head">
              <h3>
                Your Cart <span className="nx-drawer-count">{count}</span>
              </h3>
              <button className="nx-icon-btn" onClick={closeCart} aria-label="Close cart">
                ✕
              </button>
            </div>

            {cartLoading && lines.length === 0 ? (
              <div className="nx-drawer-empty">
                <p>Loading your cart…</p>
              </div>
            ) : lines.length === 0 ? (
              <div className="nx-drawer-empty">
                <strong>Your cart is empty</strong>
                <p>Add something you love and it will show up here.</p>
                <Link href="/shop" className="nx-btn nx-btn-accent" onClick={closeCart}>
                  Explore Collection
                </Link>
              </div>
            ) : (
              <>
                <div className="nx-drawer-ship">
                  {toFree > 0 ? (
                    <p>
                      <b>{formatPrice(toFree)}</b> away from free shipping
                    </p>
                  ) : (
                    <p>🎉 You unlocked <b>free shipping</b></p>
                  )}
                  <span className="nx-ship-bar" aria-hidden>
                    <motion.span
                      className="nx-ship-fill"
                      animate={{ width: `${freePct}%` }}
                      transition={{ duration: 0.5, ease: EASE }}
                    />
                  </span>
                </div>

                <div className="nx-drawer-body">
                  {lines.map((l) => (
                    <div className="nx-drawer-line" key={l.key}>
                      <Link href={`/shop/${l.productId}`} onClick={closeCart} className="nx-mini-img is-lg">
                        <Image src={resolveImage(l.image, l.name, 132, 160)} alt={l.name} width={66} height={80} />
                      </Link>
                      <div>
                        <p className="nx-drawer-name">{l.name}</p>
                        <p className="nx-drawer-meta">
                          {[l.color, l.size].filter(Boolean).join(" · ") || "Standard"}
                        </p>
                        {!l.isAvailable && (
                          <p className="nx-drawer-meta" style={{ color: "#b91c1c" }}>
                            {l.unavailableReason ?? "No longer available"}
                          </p>
                        )}
                        <div className="nx-qty is-sm" aria-label="Quantity">
                          <button onClick={() => void updateQty(l.itemId, -1)} aria-label="Decrease">−</button>
                          <span>{l.qty}</span>
                          <button onClick={() => void updateQty(l.itemId, 1)} aria-label="Increase">+</button>
                        </div>
                      </div>
                      <div className="nx-drawer-right">
                        <span className="nx-line-price">{formatPrice(l.price * l.qty)}</span>
                        <button className="nx-line-remove" onClick={() => void removeItem(l.itemId)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="nx-drawer-foot">
                  <div className="nx-sum-row is-total">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="nx-drawer-ctas">
                    <Link href="/cart" className="nx-btn nx-btn-ghost" onClick={closeCart}>
                      View Cart
                    </Link>
                    <Link href="/checkout" className="nx-btn nx-btn-accent" onClick={closeCart}>
                      Checkout
                      <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
