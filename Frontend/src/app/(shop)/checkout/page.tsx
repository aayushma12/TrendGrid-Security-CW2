"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { resolveImage } from "@/lib/fashion-images";
import { useStore } from "@/lib/store-context";
import { useAuth, formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { placeOrder, previewCheckout } from "@/lib/api/checkout";
import { initiateEsewaPayment, redirectToEsewa } from "@/lib/api/payment";
import { listMyOrders } from "@/lib/api/orders";
import { formatPrice } from "@/lib/shop-data";
import type { CheckoutSummaryDto, OrderAddress } from "@/lib/api/types";


const BLANK_ADDRESS: OrderAddress = {
  fullName: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", postalCode: "", country: "",
};

/** /checkout — Nexa-themed checkout, backed by the real /checkout preview + place-order API. */
export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { lines, count, cartLoading, refreshCart, showToast } = useStore();

  const [shipping, setShipping] = useState<OrderAddress>(BLANK_ADDRESS);
  const [billing, setBilling] = useState<OrderAddress>(BLANK_ADDRESS);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [addressPrefilled, setAddressPrefilled] = useState(false);
  const [customerNote, setCustomerNote] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | undefined>(undefined);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [summary, setSummary] = useState<CheckoutSummaryDto | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ESEWA">("COD");

  const loadPreview = useCallback(async (code?: string) => {
    if (!isAuthenticated || lines.length === 0) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await previewCheckout(code);
      setSummary(res.data);
    } catch (err) {
      setPreviewError(err instanceof ApiError ? err.message : formatAuthError(err));
      setSummary(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [isAuthenticated, lines.length]);

  useEffect(() => {
    void loadPreview(couponCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, lines.length]);

  /*
   * Automation: don't make a returning shopper retype everything.
   * 1. Start from their signed-in profile (name + phone).
   * 2. Then, if they've ordered before, overwrite with the shipping/billing
   *    address from their most recent order — the strongest signal we have
   *    for "where do they actually want this delivered".
   * Runs once per sign-in; never overwrites an address the shopper is
   * already editing on a later render.
   */
  useEffect(() => {
    if (!isAuthenticated || !user || addressPrefilled) return;
    setAddressPrefilled(true);

    const profileName = `${user.firstName} ${user.lastName}`.trim();
    setShipping((prev) => ({
      ...prev,
      fullName: prev.fullName || profileName,
      phone: prev.phone || user.phoneNumber || "",
    }));

    void listMyOrders({ limit: 1, sortBy: "placedAt", sortOrder: "desc" })
      .then((res) => {
        const last = res.data[0];
        if (!last) return;
        setShipping(last.shippingAddress);
        const sameAddr = JSON.stringify(last.billingAddress) === JSON.stringify(last.shippingAddress);
        setSameAsShipping(sameAddr);
        if (!sameAddr) setBilling(last.billingAddress);
      })
      .catch(() => {
        // No previous orders (or the lookup failed) — the profile-based prefill above still stands.
      });
  }, [isAuthenticated, user, addressPrefilled]);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await previewCheckout(code);
      setSummary(res.data);
      setCouponCode(code);
      showToast(`Coupon "${code}" applied`);
    } catch (err) {
      setCouponError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setApplyingCoupon(false);
    }
  }

  function removeCoupon() {
    setCouponCode(undefined);
    setCouponInput("");
    setCouponError(null);
    void loadPreview(undefined);
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setPlacing(true);
    try {
      const res = await placeOrder({
        couponCode,
        paymentMethod,
        shippingAddress: shipping,
        billingAddress: sameAsShipping ? undefined : billing,
        customerNote: customerNote.trim() || undefined,
      });
      await refreshCart();

      if (paymentMethod === "ESEWA") {
        showToast("Redirecting to eSewa…");
        const esewa = await initiateEsewaPayment(res.data.orderId);
        redirectToEsewa(esewa.data);
        return; // browser is navigating away to eSewa
      }

      showToast(`Order ${res.data.orderNumber} placed — thank you!`, 5000);
      router.push(`/orders/${res.data.orderId}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
      setPlacing(false);
    }
  }

  function setShippingField<K extends keyof OrderAddress>(key: K, value: OrderAddress[K]) {
    setShipping((p) => ({ ...p, [key]: value }));
  }
  function setBillingField<K extends keyof OrderAddress>(key: K, value: OrderAddress[K]) {
    setBilling((p) => ({ ...p, [key]: value }));
  }

  const totals = summary ?? {
    subtotal: lines.reduce((s, l) => s + l.price * l.qty, 0),
    discountAmount: 0, couponCode: null, couponDiscount: 0,
    shippingCharge: 0, taxAmount: 0,
    grandTotal: lines.reduce((s, l) => s + l.price * l.qty, 0),
    currency: "NPR", items: [],
  };

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/cart">Cart</Link>
            <span aria-hidden>/</span>
            <span>Checkout</span>
          </nav>

          <div className="nx-page-head">
            <h1 className="nx-page-title">Checkout</h1>
          </div>

          {authLoading || cartLoading ? (
            <p style={{ padding: "40px 0", color: "var(--nx-muted, #6b7280)" }}>Loading…</p>
          ) : !isAuthenticated ? (
            <div className="nx-empty">
              <strong>Sign in to check out</strong>
              You&apos;ll need an account so we can save your order and let you track it.
              <div style={{ marginTop: 20 }}>
                <Link href="/login?redirect=/checkout" className="nx-btn nx-btn-accent">
                  Sign in
                </Link>
              </div>
            </div>
          ) : lines.length === 0 ? (
            <div className="nx-empty">
              <strong>Nothing to check out</strong>
              Your cart is empty.
              <div style={{ marginTop: 20 }}>
                <Link href="/shop" className="nx-btn nx-btn-accent">
                  Back to Shop
                </Link>
              </div>
            </div>
          ) : (
            <form className="nx-checkout" onSubmit={submitOrder}>
              <div>
                <div className="nx-form-card">
                  <h3>Shipping Details</h3>
                  <div className="nx-form-grid">
                    <div className="nx-field is-full">
                      <label htmlFor="fn">Full name</label>
                      <input id="fn" className="nx-input" required placeholder="Alex Sharma"
                        value={shipping.fullName} onChange={(e) => setShippingField("fullName", e.target.value)} />
                    </div>
                    <div className="nx-field is-full">
                      <label htmlFor="ad">Address</label>
                      <input id="ad" className="nx-input" required placeholder="Street, house number"
                        value={shipping.addressLine1} onChange={(e) => setShippingField("addressLine1", e.target.value)} />
                    </div>
                    <div className="nx-field is-full">
                      <label htmlFor="ad2">Address line 2</label>
                      <input id="ad2" className="nx-input" placeholder="Optional"
                        value={shipping.addressLine2} onChange={(e) => setShippingField("addressLine2", e.target.value)} />
                    </div>
                    <div className="nx-field">
                      <label htmlFor="ci">City</label>
                      <input id="ci" className="nx-input" required placeholder="Kathmandu"
                        value={shipping.city} onChange={(e) => setShippingField("city", e.target.value)} />
                    </div>
                    <div className="nx-field">
                      <label htmlFor="st">State / Province</label>
                      <input id="st" className="nx-input" placeholder="Optional"
                        value={shipping.state} onChange={(e) => setShippingField("state", e.target.value)} />
                    </div>
                    <div className="nx-field">
                      <label htmlFor="zp">Postal code</label>
                      <input id="zp" className="nx-input" required placeholder="44600"
                        value={shipping.postalCode} onChange={(e) => setShippingField("postalCode", e.target.value)} />
                    </div>
                    <div className="nx-field">
                      <label htmlFor="co">Country</label>
                      <input id="co" className="nx-input" required placeholder="Nepal"
                        value={shipping.country} onChange={(e) => setShippingField("country", e.target.value)} />
                    </div>
                    <div className="nx-field is-full">
                      <label htmlFor="ph">Phone</label>
                      <input id="ph" type="tel" className="nx-input" required placeholder="+977 98..."
                        value={shipping.phone} onChange={(e) => setShippingField("phone", e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="nx-form-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Billing address</h3>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} />
                      Same as shipping
                    </label>
                  </div>
                  {!sameAsShipping && (
                    <div className="nx-form-grid" style={{ marginTop: 12 }}>
                      <div className="nx-field is-full">
                        <label htmlFor="bfn">Full name</label>
                        <input id="bfn" className="nx-input" required value={billing.fullName} onChange={(e) => setBillingField("fullName", e.target.value)} />
                      </div>
                      <div className="nx-field is-full">
                        <label htmlFor="bad">Address</label>
                        <input id="bad" className="nx-input" required value={billing.addressLine1} onChange={(e) => setBillingField("addressLine1", e.target.value)} />
                      </div>
                      <div className="nx-field">
                        <label htmlFor="bci">City</label>
                        <input id="bci" className="nx-input" required value={billing.city} onChange={(e) => setBillingField("city", e.target.value)} />
                      </div>
                      <div className="nx-field">
                        <label htmlFor="bzp">Postal code</label>
                        <input id="bzp" className="nx-input" required value={billing.postalCode} onChange={(e) => setBillingField("postalCode", e.target.value)} />
                      </div>
                      <div className="nx-field is-full">
                        <label htmlFor="bco">Country</label>
                        <input id="bco" className="nx-input" required value={billing.country} onChange={(e) => setBillingField("country", e.target.value)} />
                      </div>
                      <div className="nx-field is-full">
                        <label htmlFor="bph">Phone</label>
                        <input id="bph" type="tel" className="nx-input" required value={billing.phone} onChange={(e) => setBillingField("phone", e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="nx-form-card">
                  <h3>Payment Method</h3>
                  <label className={`nx-pay-opt${paymentMethod === "ESEWA" ? " is-active" : ""}`}>
                    <input type="radio" name="pay" checked={paymentMethod === "ESEWA"} onChange={() => setPaymentMethod("ESEWA")} />
                    🟢 eSewa — pay securely online
                  </label>
                  <label className={`nx-pay-opt${paymentMethod === "COD" ? " is-active" : ""}`}>
                    <input type="radio" name="pay" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                    📦 Cash on Delivery — pay when it arrives
                  </label>
                  <p className="nx-free-ship" style={{ marginTop: 10 }}>
                    {paymentMethod === "ESEWA"
                      ? "You'll be redirected to eSewa to complete your payment securely."
                      : "Pay in cash when your order is delivered."}
                  </p>
                </div>

                <div className="nx-form-card">
                  <h3>Order Note</h3>
                  <div className="nx-field is-full">
                    <label htmlFor="note">Anything we should know?</label>
                    <textarea id="note" className="nx-input" rows={3} placeholder="Optional"
                      value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} />
                  </div>
                </div>
              </div>

              <aside className="nx-summary">
                <h3>Your Order ({count})</h3>
                {lines.map((l) => (
                  <div className="nx-mini-line" key={l.key}>
                    <span className="nx-mini-img">
                      <Image src={resolveImage(l.image, l.name, 92, 112)} alt="" width={46} height={56} />
                    </span>
                    <span>
                      <b>{l.name}</b> × {l.qty}
                      <br />
                      <small>{[l.color, l.size].filter(Boolean).join(" · ") || "Standard"}</small>
                    </span>
                    <span className="nx-mini-price">{formatPrice(l.price * l.qty)}</span>
                  </div>
                ))}

                <div className="nx-field" style={{ marginTop: 12 }}>
                  <label htmlFor="coupon">Coupon code</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      id="coupon" className="nx-input" placeholder="SUMMER20"
                      value={couponCode ? couponCode : couponInput}
                      disabled={Boolean(couponCode)}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    {couponCode ? (
                      <button type="button" className="nx-btn nx-btn-ghost" onClick={removeCoupon}>Remove</button>
                    ) : (
                      <button type="button" className="nx-btn nx-btn-ghost" disabled={applyingCoupon || !couponInput.trim()} onClick={() => void applyCoupon()}>
                        {applyingCoupon ? "…" : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponError && <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 4 }}>{couponError}</p>}
                </div>

                {previewLoading ? (
                  <p style={{ marginTop: 12, fontSize: 13, color: "var(--nx-muted, #6b7280)" }}>Calculating totals…</p>
                ) : previewError ? (
                  <p style={{ marginTop: 12, fontSize: 13, color: "#b91c1c" }}>{previewError}</p>
                ) : (
                  <>
                    <div className="nx-sum-row" style={{ marginTop: 12 }}>
                      <span>Subtotal</span>
                      <span>{formatPrice(totals.subtotal)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="nx-sum-row">
                        <span>Discount</span>
                        <span>-{formatPrice(totals.discountAmount)}</span>
                      </div>
                    )}
                    {totals.couponDiscount > 0 && (
                      <div className="nx-sum-row">
                        <span>Coupon {totals.couponCode ? `(${totals.couponCode})` : ""}</span>
                        <span>-{formatPrice(totals.couponDiscount)}</span>
                      </div>
                    )}
                    <div className="nx-sum-row">
                      <span>Shipping</span>
                      <span>{totals.shippingCharge === 0 ? "Free" : formatPrice(totals.shippingCharge)}</span>
                    </div>
                    {totals.taxAmount > 0 && (
                      <div className="nx-sum-row">
                        <span>Tax</span>
                        <span>{formatPrice(totals.taxAmount)}</span>
                      </div>
                    )}
                    <div className="nx-sum-row is-total">
                      <span>Total</span>
                      <span>{formatPrice(totals.grandTotal)}</span>
                    </div>
                  </>
                )}

                <button type="submit" className="nx-btn nx-btn-accent" disabled={placing || previewLoading || Boolean(previewError)}>
                  {placing ? (paymentMethod === "ESEWA" ? "Redirecting to eSewa…" : "Placing order…") : "Place Order"}
                </button>
              </aside>
            </form>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
