"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
} from "@/lib/api/banners";
import { formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { BannerDto, BannerPlacement, BannerStatus } from "@/lib/api/types";
import { Badge, Toggle, Toast, useConfirmDialog, useToast } from "@/components/admin/ui";

const PLACEMENTS: BannerPlacement[] = ["ANNOUNCEMENT", "HERO", "PROMO"];
const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  ANNOUNCEMENT: "Announcement bar",
  HERO: "Hero banner",
  PROMO: "Promo strip",
};
const STATUS_TONE: Record<BannerStatus, string> = {
  ACTIVE: "green", SCHEDULED: "blue", EXPIRED: "slate", INACTIVE: "gray",
};

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

interface Draft {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  textColor: string;
  sortOrder: number;
  /** yyyy-mm-dd for the date input */
  startsAt: string;
  /** yyyy-mm-dd for the date input */
  expiresAt: string;
  isActive: boolean;
}

const BLANK: Draft = {
  id: "", placement: "ANNOUNCEMENT", title: "", subtext: "", ctaText: "", ctaLink: "/shop",
  bgColor: "#101828", textColor: "#ffffff", sortOrder: 0,
  startsAt: todayISODate(), expiresAt: todayISODate(), isActive: true,
};

function mapBanner(b: BannerDto): Draft {
  return {
    id: b.id,
    placement: b.placement,
    title: b.title,
    subtext: b.subtext ?? "",
    ctaText: b.ctaText ?? "",
    ctaLink: b.ctaLink ?? "",
    bgColor: b.bgColor,
    textColor: b.textColor,
    sortOrder: b.sortOrder,
    startsAt: b.startsAt.slice(0, 10),
    expiresAt: b.expiresAt.slice(0, 10),
    isActive: b.isActive,
  };
}

interface BannerPreviewProps {
  placement: BannerPlacement;
  title: string;
  subtext?: string | null;
  ctaText?: string | null;
  bgColor: string;
  textColor: string;
}

function BannerPreview({ b }: { b: BannerPreviewProps }) {
  return (
    <div
      style={{
        background: b.bgColor, color: b.textColor, borderRadius: 10, padding: b.placement === "HERO" ? "26px 22px" : "12px 16px",
        display: "flex", alignItems: "center", gap: 14, justifyContent: "center", flexWrap: "wrap", textAlign: "center",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: b.placement === "HERO" ? 20 : 14 }}>{b.title || "Banner title"}</div>
        {b.subtext && <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{b.subtext}</div>}
      </div>
      {b.ctaText && (
        <span style={{ background: b.textColor, color: b.bgColor, borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>{b.ctaText}</span>
      )}
    </div>
  );
}

export default function BannersAdmin() {
  const [banners, setBanners] = useState<BannerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBanners({ limit: 100, sortBy: "sortOrder", sortOrder: "asc" });
      setBanners(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(b: BannerDto, v: boolean) {
    const prev = banners;
    setBanners((list) => list.map((x) => (x.id === b.id ? { ...x, isActive: v } : x)));
    setBusyId(b.id);
    try {
      const res = await updateBanner(b.id, { isActive: v });
      setBanners((list) => list.map((x) => (x.id === b.id ? res.data : x)));
    } catch (err) {
      setBanners(prev);
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(b: BannerDto) {
    if (!(await confirm({ message: `Delete banner "${b.title}"?`, confirmLabel: "Delete", danger: true }))) return;
    setBusyId(b.id);
    try {
      await deleteBanner(b.id);
      setBanners((prev) => prev.filter((x) => x.id !== b.id));
      showToast("Banner deleted");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function save(d: Draft) {
    setSaving(true);
    try {
      if (d.id) {
        const res = await updateBanner(d.id, {
          placement: d.placement,
          title: d.title.trim(),
          subtext: d.subtext.trim() || null,
          ctaText: d.ctaText.trim() || null,
          ctaLink: d.ctaLink.trim() || null,
          bgColor: d.bgColor,
          textColor: d.textColor,
          sortOrder: d.sortOrder,
          startsAt: toStartOfDayISO(d.startsAt),
          expiresAt: toEndOfDayISO(d.expiresAt),
          isActive: d.isActive,
        });
        setBanners((prev) => prev.map((b) => (b.id === d.id ? res.data : b)));
        showToast("Banner updated");
      } else {
        const res = await createBanner({
          placement: d.placement,
          title: d.title.trim(),
          subtext: d.subtext.trim() || undefined,
          ctaText: d.ctaText.trim() || undefined,
          ctaLink: d.ctaLink.trim() || undefined,
          bgColor: d.bgColor,
          textColor: d.textColor,
          sortOrder: d.sortOrder,
          startsAt: toStartOfDayISO(d.startsAt),
          expiresAt: toEndOfDayISO(d.expiresAt),
          isActive: d.isActive,
        });
        setBanners((prev) => [...prev, res.data]);
        showToast("Banner created");
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

  const groups = PLACEMENTS.map((p) => ({ placement: p, items: banners.filter((b) => b.placement === p) }));

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Banners</h2>
          <p>Loaded from the Trendgrid API. Announcement bar, hero banners and promo strips — with live preview.</p>
        </div>
        <div className="adm-head-actions">
          <button className="adm-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
          <button className="adm-btn adm-btn-primary" onClick={() => setEditing({ ...BLANK })} disabled={loading}>+ New banner</button>
        </div>
      </div>

      {loading && <div className="adm-empty" style={{ padding: 20 }}>Loading banners…</div>}

      {!loading && error && (
        <div className="adm-empty" style={{ padding: 20 }}>
          {error}{" "}
          <button className="adm-btn adm-btn-sm" onClick={() => void load()} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      {!loading && !error && groups.map((g) => (
        <div className="adm-card" key={g.placement} style={{ marginBottom: 16 }}>
          <div className="adm-card-head">
            <div>
              <h3>{BANNER_PLACEMENT_LABELS[g.placement]}</h3>
              <p>{g.items.filter((b) => b.isActive).length} active of {g.items.length}</p>
            </div>
            <button className="adm-btn adm-btn-sm" style={{ marginLeft: "auto" }} onClick={() => setEditing({ ...BLANK, placement: g.placement })}>+ Add</button>
          </div>
          <div className="adm-card-body" style={{ display: "grid", gap: 14 }}>
            {g.items.length === 0 && <div className="adm-empty" style={{ padding: 20 }}>No {BANNER_PLACEMENT_LABELS[g.placement].toLowerCase()} banners.</div>}
            {g.items.map((b) => (
              <div key={b.id} style={{ display: "grid", gap: 10, border: "1px solid var(--adm-border)", borderRadius: 12, padding: 14, opacity: b.isActive ? 1 : 0.55 }}>
                <BannerPreview b={b} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                  <span className="adm-cell-sub">{b.startsAt.slice(0, 10)} → {b.expiresAt.slice(0, 10)}</span>
                  {b.ctaLink && <span className="adm-cell-sub">· links to {b.ctaLink}</span>}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <Toggle checked={b.isActive} onChange={(v) => void toggle(b, v)} />
                    <button className="adm-btn adm-btn-sm" onClick={() => setEditing(mapBanner(b))} disabled={busyId === b.id}>Edit</button>
                    <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => void remove(b)} disabled={busyId === b.id}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editing && <BannerModal draft={editing} saving={saving} onClose={() => !saving && setEditing(null)} onSave={save} />}
      <Toast msg={toast} />
      {dialog}
    </>
  );
}

function BannerModal({
  draft, saving, onClose, onSave,
}: { draft: Draft; saving: boolean; onClose: () => void; onSave: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(draft);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const isNew = !draft.id;
  const datesValid = !d.startsAt || !d.expiresAt || d.startsAt <= d.expiresAt;

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{isNew ? "New banner" : "Edit banner"}</h3>
          <button className="adm-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div style={{ marginBottom: 18 }}><BannerPreview b={d} /></div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Placement</label>
              <select className="adm-select" value={d.placement} onChange={(e) => set("placement", e.target.value as BannerPlacement)}>
                {PLACEMENTS.map((p) => <option key={p} value={p}>{BANNER_PLACEMENT_LABELS[p]}</option>)}
              </select>
            </div>
            <div className="adm-field">
              <label>CTA link</label>
              <input className="adm-input" value={d.ctaLink} onChange={(e) => set("ctaLink", e.target.value)} placeholder="/shop" />
            </div>
          </div>
          <div className="adm-field">
            <label>Title</label>
            <input className="adm-input" value={d.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="adm-field">
            <label>Subtext</label>
            <input className="adm-input" value={d.subtext} onChange={(e) => set("subtext", e.target.value)} placeholder="Optional" />
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>CTA text</label>
              <input className="adm-input" value={d.ctaText} onChange={(e) => set("ctaText", e.target.value)} placeholder="Optional (e.g. Shop now)" />
            </div>
            <div className="adm-field">
              <label>Sort order</label>
              <input
                className="adm-input" type="number" min={0} value={d.sortOrder}
                onChange={(e) => set("sortOrder", Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Background</label>
              <input className="adm-input" type="color" value={d.bgColor} onChange={(e) => set("bgColor", e.target.value)} style={{ padding: 4, height: 40 }} />
            </div>
            <div className="adm-field">
              <label>Text color</label>
              <input className="adm-input" type="color" value={d.textColor} onChange={(e) => set("textColor", e.target.value)} style={{ padding: 4, height: 40 }} />
            </div>
          </div>
          <div className="adm-form-row">
            <div className="adm-field"><label>Starts</label><input className="adm-input" type="date" value={d.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></div>
            <div className="adm-field"><label>Expires</label><input className="adm-input" type="date" value={d.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} /></div>
          </div>
          {!datesValid && <p className="adm-hint" style={{ color: "#b91c1c" }}>Start date must be on or before the expiry date.</p>}
          <div className="adm-switchrow">
            <div className="adm-switchrow-info"><strong>Active</strong><span>Show on the storefront now</span></div>
            <Toggle checked={d.isActive} onChange={(v) => set("isActive", v)} />
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="adm-btn adm-btn-primary"
            disabled={!d.title.trim() || !datesValid || saving}
            onClick={() => onSave(d)}
          >
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
