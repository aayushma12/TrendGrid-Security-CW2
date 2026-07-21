"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getOrderStats } from "@/lib/api/orders";
import type { OrderStats } from "@/lib/api/orders";
import { listOrders } from "@/lib/api/orders";
import { getCatalogStats } from "@/lib/api/products";
import type { CatalogStats } from "@/lib/api/products";
import type { OrderDto } from "@/lib/api/types";
import { money } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-label">{label}</div>
      <div className="adm-stat-value">{value}</div>
      {sub && <div className="adm-stat-delta">{sub}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- dashboard */

export default function AdminDashboard() {
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRes, catalogRes, recentRes] = await Promise.all([
        getOrderStats(),
        getCatalogStats(),
        listOrders({ limit: 6, sortBy: "placedAt", sortOrder: "desc" }),
      ]);
      setOrderStats(orderRes.data);
      setCatalogStats(catalogRes.data);
      setRecentOrders(recentRes.data);
    } catch {
      // Individual cards render "—" when their source call fails — no need to block the whole page.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Dashboard</h2>
          <p>Live overview of your store. Jump into any area from the sidebar.</p>
        </div>
        <div className="adm-head-actions">
          <Link href="/admin/products" className="adm-btn">Manage products</Link>
          <Link href="/admin/homepage" className="adm-btn adm-btn-primary">Edit homepage</Link>
        </div>
      </div>

      <div className="adm-stats">
        <StatCard label="Revenue (paid)" value={orderStats ? money(orderStats.totalRevenue) : "—"} sub={orderStats ? `${money(orderStats.monthlyRevenue)} this month` : undefined} />
        <StatCard label="Orders" value={orderStats ? String(orderStats.totalOrders) : "—"} sub={orderStats ? `${orderStats.todayOrders} today` : undefined} />
        <StatCard label="Active products" value={catalogStats ? String(catalogStats.activeProducts) : "—"} sub={catalogStats ? `${catalogStats.totalProducts} total` : undefined} />
        <StatCard label="Categories" value={catalogStats ? String(catalogStats.productsPerCategory.length) : "—"} />
      </div>

      {orderStats && orderStats.bestSellers.length > 0 && (
        <div className="adm-card" style={{ marginBottom: 18 }}>
          <div className="adm-card-head">
            <div>
              <h3>Best sellers</h3>
              <p>By units sold across non-cancelled orders</p>
            </div>
          </div>
          <div className="adm-card-body" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {orderStats.bestSellers.map((p) => (
              <div key={p.productId} style={{ padding: "8px 12px", border: "1px solid var(--adm-border, #e5e7eb)", borderRadius: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.productName}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{p.quantitySold} sold · {money(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="adm-card">
        <div className="adm-card-head">
          <div>
            <h3>Recent orders</h3>
            <p>Latest activity across your store</p>
          </div>
          <Link href="/admin/orders" className="adm-btn adm-btn-sm" style={{ marginLeft: "auto" }}>View all</Link>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th style={{ textAlign: "right" }}>Total</th></tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5}><div className="adm-empty">Loading recent orders…</div></td></tr>
              )}
              {!loading && recentOrders.length === 0 && (
                <tr><td colSpan={5}><div className="adm-empty">No orders yet.</div></td></tr>
              )}
              {!loading && recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="adm-cell-main">{o.orderNumber}</td>
                  <td>{o.shippingAddress.fullName}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td><PaymentStatusBadge status={o.paymentStatus} /></td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{money(o.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
