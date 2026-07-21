"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ADMIN_ORDERS, ADMIN_PRODUCTS, ADMIN_CATEGORIES } from "@/lib/admin-data";
import { OrderBadge, PayBadge, money } from "@/components/admin/ui";

/* ---------------------------------------------------------------- stat card */

function StatCard({ label, value, delta, up }: { label: string; value: string; delta: string; up: boolean }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-label">{label}</div>
      <div className="adm-stat-value">{value}</div>
      <div className={`adm-stat-delta ${up ? "up" : "down"}`}>{up ? "▲" : "▼"} {delta} vs last period</div>
    </div>
  );
}

/* --------------------------------------------------------------- sales data */

type Period = "7d" | "30d" | "12m";
const PERIODS: { key: Period; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "12m", label: "12 months" },
];

interface Point { label: string; value: number }

/** Deterministic revenue series with a gentle upward trend + weekly rhythm. */
function buildSeries(period: Period): Point[] {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let seed = period === "7d" ? 7 : period === "30d" ? 30 : 12;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const now = new Date();

  if (period === "12m") {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const trend = 4200 + i * 320;
      const value = Math.round(trend + rand() * 1800 - 600);
      return { label: MONTHS[d.getMonth()], value: Math.max(1200, value) };
    });
  }

  const n = period === "7d" ? 7 : 30;
  return Array.from({ length: n }).map((_, i) => {
    const d = new Date(now.getTime() - (n - 1 - i) * 86400000);
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? 1.25 : 1;
    const trend = 320 + (i / n) * 220;
    const value = Math.round((trend + rand() * 260 - 90) * weekend);
    const label = period === "7d" ? DAYS[d.getDay()] : `${d.getMonth() + 1}/${d.getDate()}`;
    return { label, value: Math.max(80, value) };
  });
}

function niceMax(v: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / pow) * pow;
}

/* --------------------------------------------------------------- sales chart */

function SalesChart() {
  const [period, setPeriod] = useState<Period>("30d");
  const data = useMemo(() => buildSeries(period), [period]);

  const total = data.reduce((s, p) => s + p.value, 0);
  const prevApprox = total * (period === "12m" ? 0.89 : 0.92);
  const deltaPct = (((total - prevApprox) / prevApprox) * 100).toFixed(1);

  const W = 760, H = 300;
  const padL = 52, padR = 18, padT = 22, padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxY = niceMax(Math.max(...data.map((d) => d.value)));
  const n = data.length;

  const x = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH - (v / maxY) * plotH;
  const baseline = padT + plotH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${x(n - 1).toFixed(1)} ${baseline} L ${x(0).toFixed(1)} ${baseline} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxY * f));
  const labelEvery = Math.ceil(n / 7);

  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <div>
          <h3>Sales</h3>
          <p>Revenue over the selected period</p>
        </div>
        <div className="adm-pills" style={{ margin: 0, marginLeft: "auto" }}>
          {PERIODS.map((p) => (
            <button key={p.key} className={`adm-pill${period === p.key ? " is-active" : ""}`} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="adm-card-body">
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--adm-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>{money(total)}</span>
          <span className="adm-stat-delta up" style={{ marginTop: 0 }}>▲ {deltaPct}% vs previous</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Sales chart" style={{ display: "block" }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9f24e" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#c9f24e" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {gridVals.map((gv, i) => {
            const gy = y(gv);
            return (
              <g key={i}>
                <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="#e6e6e0" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3 4"} />
                <text x={padL - 10} y={gy + 4} textAnchor="end" fontSize="11" fill="#6b6b66" fontFamily="var(--adm-body)">
                  {gv >= 1000 ? `$${(gv / 1000).toFixed(gv % 1000 ? 1 : 0)}k` : `$${gv}`}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#salesFill)" />
          <path d={linePath} fill="none" stroke="#131311" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {data.map((d, i) => (
            <g key={i}>
              {i % labelEvery === 0 && (
                <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#6b6b66" fontFamily="var(--adm-body)">{d.label}</text>
              )}
              <circle cx={x(i)} cy={y(d.value)} r="9" fill="transparent">
                <title>{`${d.label}: ${money(d.value)}`}</title>
              </circle>
              {i === n - 1 && <circle cx={x(i)} cy={y(d.value)} r="4.5" fill="#131311" stroke="#c9f24e" strokeWidth="2.5" />}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- dashboard */

export default function AdminDashboard() {
  const revenue = ADMIN_ORDERS.filter((o) => o.payment === "paid").reduce((s, o) => s + o.total, 0);
  const activeProducts = ADMIN_PRODUCTS.filter((p) => p.status === "active").length;
  const recent = [...ADMIN_ORDERS].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your store. Jump into any area from the sidebar.</p>
        </div>
        <div className="adm-head-actions">
          <Link href="/admin/products" className="adm-btn">Manage products</Link>
          <Link href="/admin/homepage" className="adm-btn adm-btn-primary">Edit homepage</Link>
        </div>
      </div>

      <div className="adm-stats">
        <StatCard label="Revenue (paid)" value={money(revenue)} delta="12.4%" up />
        <StatCard label="Orders" value={String(ADMIN_ORDERS.length)} delta="8.1%" up />
        <StatCard label="Active products" value={String(activeProducts)} delta="3.2%" up />
        <StatCard label="Categories" value={String(ADMIN_CATEGORIES.length)} delta="0.0%" up />
      </div>

      <div style={{ marginBottom: 18 }}>
        <SalesChart />
      </div>

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
              {recent.map((o) => (
                <tr key={o.id}>
                  <td className="adm-cell-main">{o.orderNumber}</td>
                  <td>{o.customer}</td>
                  <td><OrderBadge status={o.status} /></td>
                  <td><PayBadge status={o.payment} /></td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
