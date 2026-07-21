"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { cancelOrder, getOrder } from "@/lib/api/orders";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { OrderDto } from "@/lib/api/types";
import {
  DeliveryProgress, OrderErrorState, OrderStatusBadge, OrderTimeline, PaymentStatusBadge,
  fmtDate, formatMoney,
} from "@/components/orders";

const CANCELLABLE = new Set(["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "READY_FOR_SHIPMENT"]);

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getOrder(id);
      setOrder(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel() {
    if (!order || !confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const res = await cancelOrder(order.id);
      setOrder(res.data);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/orders">My Orders</Link>
            <span aria-hidden>/</span>
            <span>{order?.orderNumber ?? "Order"}</span>
          </nav>

          {authLoading || loading ? (
            <p style={{ padding: "40px 0", color: "var(--nx-muted, #6b7280)" }}>Loading order…</p>
          ) : !isAuthenticated ? (
            <OrderErrorState message="Sign in to view this order." />
          ) : error ? (
            <OrderErrorState message={error} onRetry={() => void load()} />
          ) : order ? (
            <>
              <div className="nx-page-head" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <h1 className="nx-page-title">{order.orderNumber}</h1>
                  <p style={{ color: "var(--nx-muted, #6b7280)", marginTop: 4, fontSize: 14 }}>
                    Tracking {order.trackingNumber} · Placed {fmtDate(order.placedAt)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <OrderStatusBadge status={order.status} className="text-sm" />
                  <PaymentStatusBadge status={order.paymentStatus} className="text-sm" />
                </div>
              </div>

              <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr", marginTop: 8 }} className="md:grid-cols-3">
                <div className="md:col-span-2" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="nx-form-card">
                    <h3>Delivery progress</h3>
                    <DeliveryProgress status={order.status} />
                    {order.estimatedDelivery && (
                      <p style={{ marginTop: 12, fontSize: 14 }}>
                        <strong>Estimated delivery:</strong> {fmtDate(order.estimatedDelivery)}
                      </p>
                    )}
                  </div>

                  <div className="nx-form-card">
                    <h3>Items</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {order.items.map((it) => (
                        <div key={it.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{it.productName}</div>
                            <div style={{ color: "var(--nx-muted, #6b7280)", fontSize: 13 }}>
                              {it.variantSku}
                              {it.colorName ? ` · ${it.colorName}` : ""}
                              {it.sizeName ? ` · ${it.sizeName}` : ""} × {it.quantity}
                            </div>
                          </div>
                          <div style={{ fontWeight: 600 }}>{formatMoney(it.lineTotal, order.currency)}</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span>Subtotal</span><span>{formatMoney(order.subtotal, order.currency)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                          <span>Discount</span><span>-{formatMoney(order.discountAmount, order.currency)}</span>
                        </div>
                      )}
                      {order.couponCode && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                          <span>Coupon · {order.couponCode}</span><span>-{formatMoney(order.couponDiscount, order.currency)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span>Shipping</span><span>{formatMoney(order.shippingCharge, order.currency)}</span>
                      </div>
                      {order.taxAmount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                          <span>Tax</span><span>{formatMoney(order.taxAmount, order.currency)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: "1px solid #eee" }}>
                        <span>Total</span><span>{formatMoney(order.grandTotal, order.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {CANCELLABLE.has(order.status) && (
                    <button type="button" className="nx-btn nx-btn-ghost" disabled={cancelling} onClick={() => void handleCancel()}>
                      {cancelling ? "Cancelling…" : "Cancel order"}
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="nx-form-card">
                    <h3>Shipping address</h3>
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 600 }}>{order.shippingAddress.fullName}</div>
                      <div>{order.shippingAddress.phone}</div>
                      <div>
                        {order.shippingAddress.addressLine1}
                        {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                      </div>
                      <div>
                        {order.shippingAddress.city}
                        {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} {order.shippingAddress.postalCode}
                      </div>
                      <div>{order.shippingAddress.country}</div>
                    </div>
                  </div>

                  <div className="nx-form-card">
                    <h3>Status history</h3>
                    <OrderTimeline status={order.status} history={order.statusHistory} />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
