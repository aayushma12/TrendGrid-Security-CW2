"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
} from "@/lib/api/coupons";
import { formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { CouponDto, CouponStatus, CouponType } from "@/lib/api/types";
import { Badge, Toggle, Toast, useConfirmDialog, useToast, money } from "@/components/admin/ui";

const TYPES: CouponType[] = ["PERCENTAGE", "FIXED"];
const TYPE_LABELS: Record<CouponType, string> = { PERCENTAGE: "Percentage off", FIXED: "Fixed amount off" };
const STATUS_TONE: Record<CouponStatus, string> = { ACTIVE: "green", EXPIRED: "slate", INACTIVE: "gray" };

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
/** yyyy-mm-dd (date input) -> ISO datetime for the API. */
function toStartOfDayISO(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}
function toEndOfDayISO(date: string): string {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}
function valueLabel(c: Pick<Draft, "type" | "value">): string {
  return c.type === "PERCENTAGE" ? `${c.value}% off` : `${money(c.value)} off`;
}

interface Draft {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minimumPurchase: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  /** yyyy-mm-dd for the date input */
  startDate: string;
  /** yyyy-mm-dd for the date input */
  endDate: string;
  isActive: boolean;
  status: CouponStatus;
}

const BLANK: Draft = {
  id: "",
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 10,
  minimumPurchase: null,
  maximumDiscount: null,
  usageLimit: null,
  usageCount: 0,
  perUserLimit: null,
  startDate: todayISODate(),
  endDate: todayISODate(),
  isActive: true,
  status: "ACTIVE",
};

function mapCoupon(c: CouponDto): Draft {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? "",
    type: c.type,
    value: c.value,
    minimumPurchase: c.minimumPurchase,
    maximumDiscount: c.maximumDiscount,
    usageLimit: c.usageLimit,
    usageCount: c.usageCount,
    perUserLimit: c.perUserLimit,
    startDate: c.startDate.slice(0, 10),
    endDate: c.endDate.slice(0, 10),
    isActive: c.isActive,
    status: c.status,
  };
}

export default function DiscountsAdmin() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCoupons({ limit: 100 });
      setCoupons(res.data);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.status === "ACTIVE").length;
    const redemptions = coupons.reduce((s, c) => s + c.usageCount, 0);
    return { active, redemptions, total: coupons.length };
  }, [coupons]);

  async function toggle(c: CouponDto, v: boolean) {
    const prev = coupons;
    setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, isActive: v } : x)));
    try {
      const res = await updateCoupon(c.id, { isActive: v });
      setCoupons((list) => list.map((x) => (x.id === c.id ? res.data : x)));
    } catch (err) {
      setCoupons(prev);
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  async function remove(c: CouponDto) {
    if (!(await confirm({ message: `Delete coupon "${c.code}"?`, confirmLabel: "Delete", danger: true }))) return;
    try {
      await deleteCoupon(c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      showToast(`“${c.code}” deleted`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  async function save(d: Draft) {
    const code = d.code.trim().toUpperCase();
    setSaving(true);
    try {
      if (d.id) {
        const res = await updateCoupon(d.id, {
          code,
          description: d.description || null,
          type: d.type,
          value: d.value,
          minimumPurchase: d.minimumPurchase,
          maximumDiscount: d.maximumDiscount,
          usageLimit: d.usageLimit,
          perUserLimit: d.perUserLimit,
          startDate: toStartOfDayISO(d.startDate),
          endDate: toEndOfDayISO(d.endDate),
          isActive: d.isActive,
        });
        setCoupons((prev) => prev.map((c) => (c.id === d.id ? res.data : c)));
        showToast(`“${code}” updated`);
      } else {
        const res = await createCoupon({
          code,
          description: d.description || undefined,
          type: d.type,
          value: d.value,
          minimumPurchase: d.minimumPurchase ?? undefined,
          maximumDiscount: d.maximumDiscount ?? undefined,
          usageLimit: d.usageLimit ?? undefined,
          perUserLimit: d.perUserLimit ?? undefined,
          startDate: toStartOfDayISO(d.startDate),
          endDate: toEndOfDayISO(d.endDate),
          isActive: d.isActive,
        });
        setCoupons((prev) => [res.data, ...prev]);
        showToast(`“${code}” created`);
      }
      setEditing(null);
    } catch (err) {
      if (err instanceof ApiError && err.errors.length > 0) {
        showToast(err.errors.map((e) => e.message).join(" "));
      } else {
        showToast(err instanceof ApiError ? err.message : formatAuthError(err));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Discounts & Coupons</h2>
          <p>Loaded from the Trendgrid API. Create promo codes — percentage or fixed amount off.</p>
        </div>
        <div className="adm-head-actions">
          <button className="adm-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
          <button className="adm-btn adm-btn-primary" onClick={() => setEditing({ ...BLANK })} disabled={loading}>
            + Create discount
          </button>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat"><div className="adm-stat-label">Total discounts</div><div className="adm-stat-value">{stats.total}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Active now</div><div className="adm-stat-value">{stats.active}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Total redemptions</div><div className="adm-stat-value">{stats.redemptions.toLocaleString()}</div></div>
      </div>

      {loading && (
        <div className="adm-card">
          <div className="adm-empty">Loading discounts from API…</div>
        </div>
      )}

      {!loading && error && (
        <div className="adm-card">
          <div className="adm-login-error" style={{ margin: 16 }} role="alert">{error}</div>
          <div style={{ padding: "0 16px 16px" }}>
            <button className="adm-btn adm-btn-primary" onClick={() => void load()}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Code</th><th>Type</th><th>Value</th><th>Usage</th><th>Schedule</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td><span className="adm-cell-main" style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.03em" }}>{c.code}</span></td>
                    <td className="adm-cell-sub">{TYPE_LABELS[c.type]}</td>
                    <td className="adm-cell-main">{valueLabel(c)}</td>
                    <td>
                      <div className="adm-cell-main">{c.usageCount.toLocaleString()}{c.usageLimit ? ` / ${c.usageLimit.toLocaleString()}` : ""}</div>
                      {c.minimumPurchase !== null && c.minimumPurchase > 0 && <div className="adm-cell-sub">min {money(c.minimumPurchase)}</div>}
                    </td>
                    <td className="adm-cell-sub">{c.startDate.slice(0, 10)} → {c.endDate.slice(0, 10)}</td>
                    <td><Badge tone={STATUS_TONE[c.status]}>{c.status.toLowerCase()}</Badge></td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                        <Toggle checked={c.isActive} onChange={(v) => void toggle(c, v)} />
                        <button className="adm-btn adm-btn-sm" onClick={() => setEditing(mapCoupon(c))}>Edit</button>
                        <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => void remove(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && <tr><td colSpan={7}><div className="adm-empty">No discounts yet. Create your first code.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <CouponModal draft={editing} saving={saving} onClose={() => !saving && setEditing(null)} onSave={(d) => void save(d)} />}
      <Toast msg={toast} />
      {dialog}
    </>
  );
}

function CouponModal({
  draft,
  saving,
  onClose,
  onSave,
}: {
  draft: Draft;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const isNew = !draft.id;
  const datesValid = !d.startDate || !d.endDate || d.startDate <= d.endDate;

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{isNew ? "Create discount" : `Edit · ${draft.code}`}</h3>
          <button className="adm-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Code</label>
              <input className="adm-input" style={{ textTransform: "uppercase" }} value={d.code} onChange={(e) => set("code", e.target.value)} placeholder="SUMMER20" />
            </div>
            <div className="adm-field">
              <label>Type</label>
              <select className="adm-select" value={d.type} onChange={(e) => set("type", e.target.value as CouponType)}>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
          </div>
          <div className="adm-field">
            <label>Description</label>
            <input className="adm-input" value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional — internal note" />
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>{d.type === "PERCENTAGE" ? "Percent (1-100)" : "Amount"}</label>
              <input
                className="adm-input"
                type="number"
                min={d.type === "PERCENTAGE" ? 1 : 0.01}
                max={d.type === "PERCENTAGE" ? 100 : undefined}
                step={d.type === "PERCENTAGE" ? 1 : 0.01}
                value={d.value}
                onChange={(e) => set("value", Number(e.target.value))}
              />
            </div>
            <div className="adm-field">
              <label>Max discount cap</label>
              <input
                className="adm-input"
                type="number"
                min={0}
                value={d.maximumDiscount ?? ""}
                placeholder="No cap"
                onChange={(e) => set("maximumDiscount", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Min order amount</label>
              <input
                className="adm-input"
                type="number"
                min={0}
                value={d.minimumPurchase ?? ""}
                placeholder="No minimum"
                onChange={(e) => set("minimumPurchase", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div />
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Total usage limit</label>
              <input
                className="adm-input"
                type="number"
                min={1}
                value={d.usageLimit ?? ""}
                placeholder="Unlimited"
                onChange={(e) => set("usageLimit", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div className="adm-field">
              <label>Per-customer limit</label>
              <input
                className="adm-input"
                type="number"
                min={1}
                value={d.perUserLimit ?? ""}
                placeholder="Unlimited"
                onChange={(e) => set("perUserLimit", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-field"><label>Starts</label><input className="adm-input" type="date" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
            <div className="adm-field"><label>Expires</label><input className="adm-input" type="date" value={d.endDate} onChange={(e) => set("endDate", e.target.value)} /></div>
          </div>
          {!datesValid && <span className="adm-hint" style={{ color: "#b91c1c" }}>Start date must be on or before the expiry date.</span>}
          <div className="adm-switchrow">
            <div className="adm-switchrow-info"><strong>Active</strong><span>Customers can use this code right away</span></div>
            <Toggle checked={d.isActive} onChange={(v) => set("isActive", v)} />
          </div>
          {!isNew && (
            <div className="adm-def" style={{ marginTop: 8 }}>
              <dt>Redeemed</dt>
              <dd>{d.usageCount.toLocaleString()} time{d.usageCount === 1 ? "" : "s"}</dd>
            </div>
          )}
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="adm-btn adm-btn-primary"
            disabled={!d.code.trim() || d.value <= 0 || !datesValid || saving}
            onClick={() => onSave(d)}
          >
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
