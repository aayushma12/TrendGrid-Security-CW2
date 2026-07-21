"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  createCollection,
  deleteCollection,
  listCollections,
  updateCollection,
  updateCollectionStatus,
} from "@/lib/api/collections";
import type { CollectionDto } from "@/lib/api/collections";
import { formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { Toggle, Toast, useConfirmDialog, useToast } from "@/components/admin/ui";

export interface AdminCollectionRow {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  visible: boolean;
  displayOrder: number;
  productCount: number;
}

type Draft = Omit<AdminCollectionRow, "productCount">;

const BLANK: Draft = {
  id: "",
  name: "",
  description: "",
  imageUrl: null,
  visible: true,
  displayOrder: 99,
};

function mapCollection(c: CollectionDto): AdminCollectionRow {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    imageUrl: c.imageUrl ?? null,
    visible: c.isActive,
    displayOrder: c.displayOrder,
    productCount: c.productCount ?? 0,
  };
}

export default function CollectionsAdmin() {
  const [rows, setRows] = useState<AdminCollectionRow[]>([]);
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
      const res = await listCollections({ limit: 100 });
      setRows(res.data.map(mapCollection));
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = [...rows].sort((a, b) => a.displayOrder - b.displayOrder);

  async function toggle(id: string, visible: boolean) {
    const prev = rows;
    setRows((list) => list.map((c) => (c.id === id ? { ...c, visible } : c)));
    try {
      await updateCollectionStatus(id, visible);
      showToast(visible ? "Collection is now visible" : "Collection hidden");
    } catch (err) {
      setRows(prev);
      showToast(formatAuthError(err));
    }
  }

  async function remove(c: AdminCollectionRow) {
    if (
      !(await confirm({
        message: `Delete collection "${c.name}"? Its products stay in the catalog — only the grouping is removed.`,
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    try {
      await deleteCollection(c.id);
      setRows((prev) => prev.filter((x) => x.id !== c.id));
      showToast(`"${c.name}" deleted`);
    } catch (err) {
      showToast(formatAuthError(err));
    }
  }

  async function save(draft: Draft, imageFile: File | null) {
    setSaving(true);
    try {
      if (draft.id) {
        const res = await updateCollection(draft.id, {
          name: draft.name,
          description: draft.description || undefined,
          isActive: draft.visible,
          displayOrder: draft.displayOrder,
          image: imageFile ?? undefined,
        });
        const updated = mapCollection(res.data);
        setRows((prev) => prev.map((c) => (c.id === draft.id ? updated : c)));
        showToast(`"${draft.name}" updated`);
      } else {
        const res = await createCollection({
          name: draft.name,
          description: draft.description || undefined,
          isActive: draft.visible,
          displayOrder: draft.displayOrder,
          image: imageFile ?? undefined,
        });
        setRows((prev) => [...prev, mapCollection(res.data)]);
        showToast(`"${draft.name}" created`);
      }
      setEditing(null);
    } catch (err) {
      if (err instanceof ApiError && err.errors.length > 0) {
        showToast(err.errors.map((e) => e.message).join(" "));
      } else {
        showToast(formatAuthError(err));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Collections</h2>
          <p>Admin-curated merchandising groups (Men, Summer Collection, Best Sellers…) shown on the storefront.</p>
        </div>
        <div className="adm-head-actions">
          <button className="adm-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
          <button
            className="adm-btn adm-btn-primary"
            onClick={() => setEditing({ ...BLANK, displayOrder: rows.length + 1 })}
            disabled={loading}
          >
            + New collection
          </button>
        </div>
      </div>

      {loading && (
        <div className="adm-card">
          <div className="adm-empty">Loading collections from API…</div>
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
                <tr>
                  <th>Collection</th>
                  <th>Products</th>
                  <th>Order</th>
                  <th>Visible</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="adm-cell-flex">
                        <div
                          style={{
                            width: 42, height: 42, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                            background: "#f2f2f2", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {c.imageUrl ? (
                            <Image src={c.imageUrl} alt={c.name} width={42} height={42} unoptimized style={{ objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: 16 }}>🏷️</span>
                          )}
                        </div>
                        <div>
                          <div className="adm-cell-main">{c.name}</div>
                          <div className="adm-cell-sub">{c.description || "No description"}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-badge slate">{c.productCount}</span></td>
                    <td>{c.displayOrder}</td>
                    <td><Toggle checked={c.visible} onChange={(v) => void toggle(c.id, v)} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button className="adm-btn adm-btn-sm" onClick={() => setEditing({ ...c })}>Edit</button>
                        <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => void remove(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="adm-empty">No collections yet. Create your first one.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <CollectionModal
          draft={editing}
          saving={saving}
          onClose={() => !saving && setEditing(null)}
          onSave={(d, file) => void save(d, file)}
        />
      )}
      <Toast msg={toast} />
      {dialog}
    </>
  );
}

function CollectionModal({
  draft,
  saving,
  onClose,
  onSave,
}: {
  draft: Draft;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft, imageFile: File | null) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const isNew = !draft.id;

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function pickImage(file: File) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  const previewSrc = imagePreview ?? d.imageUrl;

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{isNew ? "New collection" : `Edit · ${draft.name}`}</h3>
          <button className="adm-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-field">
            <label>Name</label>
            <input className="adm-input" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Summer Collection" />
          </div>
          <div className="adm-field">
            <label>Description</label>
            <textarea className="adm-textarea" value={d.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Display order</label>
              <input className="adm-input" type="number" value={d.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} />
            </div>
          </div>
          <div className="adm-switchrow">
            <div className="adm-switchrow-info"><strong>Visible</strong><span>Show this collection on the storefront</span></div>
            <Toggle checked={d.visible} onChange={(v) => set("visible", v)} />
          </div>

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Image</label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 110, height: 110, borderRadius: 8, overflow: "hidden",
                  background: "#f2f2f2", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #e5e5e5", flexShrink: 0,
                }}
              >
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt={d.name || "Collection"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 11, color: "#9a9a9a" }}>No image</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  className="adm-input"
                  type="file"
                  accept="image/*"
                  style={{ fontSize: 12 }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) pickImage(file);
                  }}
                />
                <span className="adm-hint">Uploaded when you save.</span>
              </div>
            </div>
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="adm-btn adm-btn-primary" disabled={!d.name.trim() || saving} onClick={() => onSave(d, imageFile)}>
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
