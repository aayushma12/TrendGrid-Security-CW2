"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveImage } from "@/lib/fashion-images";
import { useStore } from "@/lib/store-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice, STORE } from "@/lib/shop-data";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";

/** /cart — Nexa-themed shopping cart, backed by the real /cart API. */
export default function CartPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { lines, count, subtotal, cartLoading, updateQty, removeItem, clearCart } = useStore();
  const shipping = subtotal === 0 || subtotal >= STORE.freeShippingOver ? 0 : 10;
  const total = subtotal + shipping;
  const toFree = STORE.freeShippingOver - subtotal;
  const hasUnavailable = lines.some((l) => !l.isAvailable);

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Cart</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Your Cart</h1>
            {count > 0 && (
              <button className="nx-line-remove" onClick={() => void clearCart()}>
                Clear cart
              </button>
            )}
          </div>

          {authLoading || cartLoading ? (
            <p style={{ padding: "40px 0", color: "var(--nx-muted, #6b7280)" }}>Loading your cart…</p>
          ) : !isAuthenticated ? (
            <div className="nx-empty">
              <strong>Sign in to view your cart</strong>
              Your cart is saved to your account so it's there whenever you come back.
              <div style={{ marginTop: 20 }}>
                <Link href="/login?redirect=/cart" className="nx-btn nx-btn-accent">
                  Sign in
                </Link>
              </div>
            </div>
          ) : lines.length === 0 ? (
            <div className="nx-empty">
              <strong>Your cart is empty</strong>
              Find something you love in the collection.
              <div style={{ marginTop: 20 }}>
                <Link href="/shop" className="nx-btn nx-btn-accent">
                  Explore Collection
                </Link>
              </div>
            </div>
          ) : (
            <div className="nx-cart">
              <div className="nx-lines">
                {hasUnavailable && (
                  <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 8 }}>
                    Some items in your cart are no longer available and won&apos;t be included at checkout.
                  </p>
                )}
                {lines.map((l) => (
                  <div className="nx-line" key={l.key} style={{ opacity: l.isAvailable ? 1 : 0.55 }}>
                    <Link href={`/shop/${l.productId}`} className="nx-line-img">
                      <Image src={resolveImage(l.image, l.name, 184, 220)} alt={l.name} width={92} height={110} />
                    </Link>
                    <div>
                      <h3 className="nx-line-name">
                        <Link href={`/shop/${l.productId}`}>{l.name}</Link>
                      </h3>
                      <p className="nx-line-meta">
                        {[l.color, l.size].filter(Boolean).join(" · ") || "Standard"}
                        {" · "}
                        {formatPrice(l.price)} each
                      </p>
                      {!l.isAvailable && (
                        <p className="nx-line-meta" style={{ color: "#b91c1c" }}>
                          {l.unavailableReason ?? "No longer available"}
                        </p>
                      )}
                      <div className="nx-qty" style={{ marginTop: 10 }} aria-label="Quantity">
                        <button onClick={() => void updateQty(l.itemId, -1)} aria-label="Decrease">−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => void updateQty(l.itemId, 1)} aria-label="Increase">+</button>
                      </div>
                    </div>
                    <div className="nx-line-right">
                      <span className="nx-line-price">{formatPrice(l.price * l.qty)}</span>
                      <button className="nx-line-remove" onClick={() => void removeItem(l.itemId)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="nx-summary">
                <h3>Order Summary</h3>
                <div className="nx-sum-row">
                  <span>Subtotal ({count} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="nx-sum-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="nx-sum-row is-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <Link href="/checkout" className="nx-btn nx-btn-accent">
                  Proceed to Checkout
                  <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                {toFree > 0 && (
                  <p className="nx-free-ship">
                    Add {formatPrice(toFree)} more for free shipping.
                  </p>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
