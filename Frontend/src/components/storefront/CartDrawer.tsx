"use client";

/**
 * Slide-in cart drawer (Section 6).
 *
 * Reuses the existing cart tokens (.cart-item, .summary__row, .qty, .pimg) so it
 * looks native. Driven by the shared store context — opening on add-to-cart,
 * closing via backdrop / close button / Escape with a slide-out animation.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/shop-data";
import { fashionSrc } from "@/lib/fashion-images";
import { qtyHaptic, shakeQty } from "@/components/storefront/Interactions";

export function CartDrawer() {
  const {
    lines,
    count,
    subtotal,
    cartOpen,
    closeCart,
    updateQty,
    removeItem,
  } = useStore();
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      closeCart();
    }, 280);
  }, [closeCart]);

  // Escape to close
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, handleClose]);

  return (
    <div
      className={`cart-drawer${cartOpen ? " is-open" : ""}${closing ? " is-closing" : ""}`}
      aria-modal="true"
      role="dialog"
      aria-label="Shopping cart"
      aria-hidden={!cartOpen}
    >
      <div className="cart-drawer__backdrop" onClick={handleClose} />
      <div className="cart-drawer__panel">
        <div className="cart-drawer__head">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            Your cart <span className="cart-drawer__count">({count})</span>
          </h2>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={handleClose}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {lines.length > 0 ? (
          <div className="cart-drawer__body">
            {lines.map((line) => (
              <div className="cart-drawer__item" data-id={line.key} key={line.key}>
                <div className="cart-item">
                  <div
                    className="pimg"
                    style={{ width: 72, aspectRatio: "3/4", borderRadius: "var(--radius-md)", flexShrink: 0 }}
                  >
                    <Image
                      src={fashionSrc(line.image ?? line.name, 144, 192)}
                      alt={line.name}
                      width={72}
                      height={96}
                      className="pimg__img"
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="cart-item__name">{line.name}</p>
                    {(line.color || line.size) && (
                      <p className="cart-item__variant">
                        {[line.color, line.size].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: ".5rem" }}>
                      <div className="qty" style={{ transform: "scale(.88)", transformOrigin: "left" }}>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={(e) => {
                            if (line.qty <= 1) {
                              shakeQty(e.currentTarget.closest(".qty"));
                              removeItem(line.key);
                            } else {
                              qtyHaptic(e.currentTarget);
                              updateQty(line.key, -1);
                            }
                          }}
                        >
                          −
                        </button>
                        <span>{line.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={(e) => {
                            qtyHaptic(e.currentTarget);
                            updateQty(line.key, 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                      <span className="price__now">{formatPrice(line.price * line.qty)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => removeItem(line.key)}
                    aria-label={`Remove ${line.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cart-drawer__empty" style={{ padding: "1.25rem" }}>
            <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
              Your cart is empty
            </p>
            <Link href="/shop" className="btn btn--primary btn--block" onClick={handleClose}>
              Start shopping
            </Link>
          </div>
        )}

        {lines.length > 0 && (
          <div className="cart-drawer__foot">
            <div className="summary__row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div className="summary__row" style={{ fontSize: ".8rem", color: "var(--color-text-muted)" }}>
              Shipping calculated at checkout
            </div>
            <Link href="/checkout" className="btn btn--primary btn--block" style={{ marginTop: ".75rem" }} onClick={handleClose}>
              Checkout
            </Link>
            <Link href="/cart" className="btn btn--ghost btn--block" style={{ marginTop: ".5rem" }} onClick={handleClose}>
              View full cart
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
