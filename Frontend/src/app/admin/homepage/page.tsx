"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listAdminHomepageSections,
  reorderHomepageSections,
  updateHomepageSectionContent,
  updateHomepageSectionVisibility,
  uploadHomepageSectionImage,
} from "@/lib/api/homepage";
import { ApiError } from "@/lib/api/client";
import { formatAuthError } from "@/lib/auth-context";
import type { HomeField, HomeRepeater, HomepageSectionDto, HomeSectionContent } from "@/lib/api/types";
import { fashionSrc } from "@/lib/fashion-images";
import { Toggle, Toast, useToast } from "@/components/admin/ui";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
function imgSrc(v: string): string {
  if (!v) return fashionSrc("placeholder", 120, 150);
  return v.startsWith("http") ? v : fashionSrc(v, 120, 150);
}

export default function HomepageAdmin() {
  const [sections, setSections] = useState<HomepageSectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminHomepageSections();
      setSections([...res.data].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const visibleCount = sections.filter((s) => s.visible).length;

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next); // optimistic
    try {
      const res = await reorderHomepageSections(next.map((s) => s.id));
      setSections([...res.data].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
      void load(); // revert to server state
    }
  }

  async function toggle(id: string, v: boolean) {
    const prev = sections;
    setSections((p) => p.map((s) => (s.id === id ? { ...s, visible: v } : s))); // optimistic
    try {
      await updateHomepageSectionVisibility(id, v);
    } catch (err) {
      setSections(prev); // revert
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    }
  }

  async function saveContent(id: string, updated: HomeSectionContent) {
    setSavingId(id);
    try {
      const res = await updateHomepageSectionContent(id, updated);
      setSections((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      setEditingId(null);
      showToast(`${res.data.name} content saved`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setSavingId(null);
    }
  }

  const editingSection = sections.find((s) => s.id === editingId) ?? null;

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Homepage</h2>
          <p>Manage every section&rsquo;s text and images. Reorder and show/hide sections too — changes save to the live backend immediately.</p>
        </div>
        <div className="adm-head-actions">
          <a href="/" target="_blank" rel="noreferrer" className="adm-btn">Preview home ↗</a>
        </div>
      </div>

      <div className="adm-card" style={{ marginBottom: 18, background: "var(--adm-surface-2)" }}>
        <div className="adm-card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: 13.5 }}>
          <span style={{ color: "var(--adm-muted)" }}>Managed elsewhere:</span>
          <Link href="/admin/categories" className="adm-badge slate" style={{ textDecoration: "none" }}>Category tiles →</Link>
          <Link href="/admin/products" className="adm-badge slate" style={{ textDecoration: "none" }}>Products →</Link>
          <Link href="/admin/banners" className="adm-badge slate" style={{ textDecoration: "none" }}>Announcement banner →</Link>
        </div>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 18, borderColor: "#fca5a5" }}>
          <div className="adm-card-body" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ color: "#b91c1c" }}>{error}</span>
            <button className="adm-btn adm-btn-sm" onClick={() => void load()}>Try again</button>
          </div>
        </div>
      )}

      <div className="adm-stats">
        <div className="adm-stat"><div className="adm-stat-label">Total sections</div><div className="adm-stat-value">{sections.length}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Visible</div><div className="adm-stat-value">{visibleCount}</div></div>
        <div className="adm-stat"><div className="adm-stat-label">Hidden</div><div className="adm-stat-value">{sections.length - visibleCount}</div></div>
      </div>

      <div className="adm-card">
        <div className="adm-card-head">
          <div>
            <h3>Page sections</h3>
            <p>Reorder with the arrows · top renders first · Edit to change content</p>
          </div>
        </div>
        <div className="adm-card-body">
          {loading ? (
            <div className="adm-empty">Loading sections…</div>
          ) : sections.length === 0 ? (
            <div className="adm-empty">
              No sections yet. Run the backend seed script (<code>npx prisma db seed</code>) to create the defaults.
            </div>
          ) : (
            sections.map((s, i) => {
              const fieldCount = s.content.fields.length + s.content.repeaters.reduce((n, r) => n + r.items.length, 0);
              return (
                <div key={s.id} className={`adm-section-row${s.visible ? "" : " is-hidden"}`}>
                  <div className="adm-section-handle">
                    <button aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}>▲</button>
                    <button aria-label="Move down" disabled={i === sections.length - 1} onClick={() => void move(i, 1)}>▼</button>
                  </div>
                  <div className="adm-section-index">{i + 1}</div>
                  <div className="adm-section-info">
                    <strong>{s.name}</strong>
                    <span>{s.description} · {fieldCount} editable field{fieldCount === 1 ? "" : "s"}</span>
                  </div>
                  <div className="adm-section-actions">
                    <button className="adm-btn adm-btn-sm" onClick={() => setEditingId(s.id)}>Edit content</button>
                    <Toggle checked={s.visible} onChange={(v) => void toggle(s.id, v)} label="Visible" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {editingSection && (
        <ContentDrawer
          section={editingSection}
          saving={savingId === editingSection.id}
          onClose={() => setEditingId(null)}
          onSave={(updated) => void saveContent(editingSection.id, updated)}
          onError={showToast}
        />
      )}
      <Toast msg={toast} />
    </>
  );
}

/* ------------------------------------------------------------- drawer editor */

function ContentDrawer({
  section,
  saving,
  onClose,
  onSave,
  onError,
}: {
  section: HomepageSectionDto;
  saving: boolean;
  onClose: () => void;
  onSave: (c: HomeSectionContent) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<HomeSectionContent>(() => clone(section.content));

  function setField(key: string, value: string) {
    setDraft((d) => ({ ...d, fields: d.fields.map((f) => (f.key === key ? { ...f, value } : f)) }));
  }
  function setItem(rKey: string, index: number, fKey: string, value: string) {
    setDraft((d) => ({
      ...d,
      repeaters: d.repeaters.map((r) =>
        r.key === rKey ? { ...r, items: r.items.map((it, i) => (i === index ? { ...it, [fKey]: value } : it)) } : r,
      ),
    }));
  }
  function addItem(rKey: string) {
    setDraft((d) => ({
      ...d,
      repeaters: d.repeaters.map((r) =>
        r.key === rKey ? { ...r, items: [...r.items, Object.fromEntries(r.itemFields.map((f) => [f.key, ""]))] } : r,
      ),
    }));
  }
  function removeItem(rKey: string, index: number) {
    setDraft((d) => ({
      ...d,
      repeaters: d.repeaters.map((r) => (r.key === rKey ? { ...r, items: r.items.filter((_, i) => i !== index) } : r)),
    }));
  }

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="adm-drawer-head">
          <div>
            <h3>{section.name}</h3>
            <span className="adm-cell-sub">Homepage content</span>
          </div>
          <button className="adm-close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-drawer-body">
          {draft.note && (
            <p className="adm-hint" style={{ background: "var(--adm-surface-2)", border: "1px solid var(--adm-border)", borderRadius: 10, padding: "10px 12px", marginBottom: 18 }}>
              ⓘ {draft.note}
            </p>
          )}

          {draft.fields.map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              onChange={(v) => setField(f.key, v)}
              sectionId={section.id}
              onError={onError}
            />
          ))}

          {draft.repeaters.map((r) => (
            <RepeaterEditor
              key={r.key}
              repeater={r}
              onItemChange={(idx, fk, v) => setItem(r.key, idx, fk, v)}
              onAdd={() => addItem(r.key)}
              onRemove={(idx) => removeItem(r.key, idx)}
              sectionId={section.id}
              onError={onError}
            />
          ))}

          {draft.fields.length === 0 && draft.repeaters.length === 0 && (
            <div className="adm-empty">Nothing editable in this section.</div>
          )}
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="adm-btn adm-btn-primary" onClick={() => onSave(draft)} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  onChange,
  sectionId,
  onError,
}: {
  field: HomeField;
  onChange: (v: string) => void;
  sectionId?: string;
  onError?: (msg: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <div className="adm-field">
        <label>{field.label}</label>
        <textarea className="adm-textarea" value={field.value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "image") {
    return <ImageFieldInput field={field} onChange={onChange} sectionId={sectionId} onError={onError} />;
  }
  return (
    <div className="adm-field">
      <label>{field.label}</label>
      <input className="adm-input" value={field.value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ImageFieldInput({
  field,
  onChange,
  sectionId,
  onError,
}: {
  field: HomeField;
  onChange: (v: string) => void;
  sectionId?: string;
  onError?: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !sectionId) return;
    setUploading(true);
    try {
      const res = await uploadHomepageSectionImage(sectionId, file);
      onChange(res.data.url);
    } catch (err) {
      onError?.(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="adm-field">
      <label>{field.label}</label>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc(field.value)} alt="" width={48} height={60} style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 8, flex: "none", border: "1px solid var(--adm-border)" }} />
        <div style={{ flex: 1 }}>
          <input
            className="adm-input"
            type="file"
            accept="image/*"
            style={{ fontSize: 12 }}
            onChange={(e) => void handleBrowse(e)}
            disabled={uploading}
          />
          <span className="adm-hint">{uploading ? "Uploading…" : "Browse an image from your device to replace it."}</span>
        </div>
      </div>
    </div>
  );
}

function RepeaterEditor({
  repeater,
  onItemChange,
  onAdd,
  onRemove,
  sectionId,
  onError,
}: {
  repeater: HomeRepeater;
  onItemChange: (index: number, fieldKey: string, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  sectionId?: string;
  onError?: (msg: string) => void;
}) {
  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>{repeater.label}</label>
        <span className="adm-badge slate" style={{ marginLeft: 8 }}>{repeater.items.length}</span>
        <button className="adm-btn adm-btn-sm" style={{ marginLeft: "auto" }} onClick={onAdd}>+ Add {repeater.itemNoun}</button>
      </div>
      {repeater.items.map((item, idx) => (
        <div key={idx} style={{ border: "1px solid var(--adm-border)", borderRadius: 12, padding: 14, marginBottom: 10, background: "var(--adm-surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <span className="adm-cell-sub" style={{ fontWeight: 600 }}>{repeater.itemNoun} {idx + 1}</span>
            <button className="adm-btn adm-btn-sm adm-btn-danger" style={{ marginLeft: "auto" }} onClick={() => onRemove(idx)}>Remove</button>
          </div>
          {repeater.itemFields.map((fd) => (
            <FieldInput
              key={fd.key}
              field={{ ...fd, value: item[fd.key] ?? "" }}
              onChange={(v) => onItemChange(idx, fd.key, v)}
              sectionId={sectionId}
              onError={onError}
            />
          ))}
        </div>
      ))}
      {repeater.items.length === 0 && <div className="adm-empty" style={{ padding: 20 }}>No {repeater.itemNoun}s yet.</div>}
    </div>
  );
}
