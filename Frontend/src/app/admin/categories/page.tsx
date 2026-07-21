"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  bulkDeleteCategories,
  bulkUpdateCategoryActive,
  createCategory,
  deleteCategory,
  listAllCategories,
  removeCategoryImage,
  updateCategory,
  updateCategoryStatus,
  uploadCategoryImage,
} from "@/lib/api/categories";
import { formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { CategoryDto } from "@/lib/api/types";
import { Toggle, Toast, useConfirmDialog, useToast, fashionSrc } from "@/components/admin/ui";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Real uploaded image URL from the API, or null if none set yet. */
  imageUrl: string | null;
  /** Display source — the real image if present, otherwise a placeholder key for fashionSrc(). */
  image: string;
  visible: boolean;
  sortOrder: number;
  productCount: number;
  isFeatured: boolean;
}

type Draft = Omit<AdminCategoryRow, "productCount">;

const BLANK: Draft = {
  id: "",
  name: "",
  slug: "",
  description: "",
  imageUrl: null,
  image: "lookbook-editorial-1",
  visible: true,
  sortOrder: 99,
  isFeatured: false,
};

function mapCategory(c: CategoryDto, index: number): AdminCategoryRow {
  return {
    id: c.id,
    name: c.name,
    slug: slugify(c.name),
    description: c.description ?? "",
    imageUrl: c.imageUrl ?? null,
    image: c.imageUrl ?? "lookbook-editorial-1",
    visible: c.isActive,
    sortOrder: index + 1,
    productCount: c.childrenCount ?? 0,
    isFeatured: c.isFeatured,
  };
}

export default function CategoriesAdmin() {
  const [cats, setCats] = useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toast, showToast] = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The full category tree (top-level + subcategories) can comfortably
      // run into the hundreds — this page isn't paginated, so it pages
      // through the API itself (which caps a single request at 100).
      const all = await listAllCategories();
      setCats(all.map(mapCategory));
      setSelected(new Set());
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const sorted = [...cats].sort((a, b) => a.sortOrder - b.sortOrder);

  async function toggle(id: string, visible: boolean) {
    const prev = cats;
    setCats((list) => list.map((c) => (c.id === id ? { ...c, visible } : c)));
    try {
      await updateCategoryStatus(id, visible);
      showToast(visible ? "Category is now visible" : "Category hidden");
    } catch (err) {
      setCats(prev);
      showToast(formatAuthError(err));
    }
  }

  async function remove(c: AdminCategoryRow) {
    if (
      !(await confirm({
        message: `Delete category "${c.name}"? This cannot be undone.`,
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    try {
      await deleteCategory(c.id);
      setCats((prev) => prev.filter((x) => x.id !== c.id));
      showToast(`“${c.name}” deleted`);
    } catch (err) {
      showToast(formatAuthError(err));
    }
  }

  function toggleSelectOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const allSelected = sorted.length > 0 && sorted.every((c) => selected.has(c.id));
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(sorted.map((c) => c.id)));
  }

  async function bulkToggleVisible(visible: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await bulkUpdateCategoryActive(ids, visible);
      showToast(`${res.data.updated} categor${res.data.updated === 1 ? "y" : "ies"} ${visible ? "shown" : "hidden"}`);
      void loadCategories();
    } catch (err) {
      showToast(formatAuthError(err));
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkRemove() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (
      !(await confirm({
        message: `Delete ${ids.length} selected categor${ids.length === 1 ? "y" : "ies"}? Categories that still have products or subcategories will be skipped.`,
        confirmLabel: "Delete",
        danger: true,
      }))
    )
      return;
    setBulkBusy(true);
    try {
      const res = await bulkDeleteCategories(ids);
      if (res.data.failed.length > 0) {
        showToast(`${res.data.deleted} deleted, ${res.data.failed.length} skipped (still has products/subcategories)`);
      } else {
        showToast(`${res.data.deleted} categor${res.data.deleted === 1 ? "y" : "ies"} deleted`);
      }
      void loadCategories();
    } catch (err) {
      showToast(formatAuthError(err));
    } finally {
      setBulkBusy(false);
    }
  }

  async function save(draft: Draft, imageFile: File | null) {
    setSaving(true);
    try {
      if (draft.id) {
        const res = await updateCategory(draft.id, {
          name: draft.name,
          description: draft.description || undefined,
          isActive: draft.visible,
          isFeatured: draft.isFeatured,
        });
        const updated = mapCategory(res.data, draft.sortOrder - 1);
        setCats((prev) => prev.map((c) => (c.id === draft.id ? { ...updated, sortOrder: draft.sortOrder } : c)));
        showToast(`“${draft.name}” updated`);
      } else {
        const res = await createCategory({
          name: draft.name,
          description: draft.description || undefined,
          isActive: draft.visible,
          isFeatured: draft.isFeatured,
          image: imageFile ?? undefined,
        });
        const created = mapCategory(res.data, cats.length);
        setCats((prev) => [...prev, { ...created, sortOrder: draft.sortOrder }]);
        showToast(`“${draft.name}” created`);
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

  function applyImageUpdate(categoryId: string, imageUrl: string | null) {
    const image = imageUrl ?? "lookbook-editorial-1";
    setCats((prev) => prev.map((c) => (c.id === categoryId ? { ...c, imageUrl, image } : c)));
    setEditing((e) => (e && e.id === categoryId ? { ...e, imageUrl, image } : e));
  }

  async function handleImageUpload(categoryId: string, file: File) {
    try {
      const res = await uploadCategoryImage(categoryId, file);
      applyImageUpdate(categoryId, res.data.imageUrl);
      showToast("Image uploaded");
    } catch (err) {
      showToast(formatAuthError(err));
    }
  }

  async function handleImageRemove(categoryId: string) {
    try {
      const res = await removeCategoryImage(categoryId);
      applyImageUpdate(categoryId, res.data.imageUrl);
      showToast("Image removed");
    } catch (err) {
      showToast(formatAuthError(err));
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Categories</h2>
          <p>Loaded from the Trendgrid API. Manage your catalog hierarchy here.</p>
        </div>
        <div className="adm-head-actions">
          <button className="adm-btn" onClick={() => void loadCategories()} disabled={loading}>
            Refresh
          </button>
          <button
            className="adm-btn adm-btn-primary"
            onClick={() => setEditing({ ...BLANK, sortOrder: cats.length + 1 })}
            disabled={loading}
          >
            + New category
          </button>
        </div>
      </div>

      {loading && (
        <div className="adm-card">
          <div className="adm-empty">Loading categories from API…</div>
        </div>
      )}

      {!loading && error && (
        <div className="adm-card">
          <div className="adm-login-error" style={{ margin: 16 }} role="alert">{error}</div>
          <div style={{ padding: "0 16px 16px" }}>
            <button className="adm-btn adm-btn-primary" onClick={() => void loadCategories()}>
              Retry
            </button>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="adm-card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <strong>{selected.size} selected</strong>
          <button className="adm-btn adm-btn-sm" disabled={bulkBusy} onClick={() => void bulkToggleVisible(true)}>Show</button>
          <button className="adm-btn adm-btn-sm" disabled={bulkBusy} onClick={() => void bulkToggleVisible(false)}>Hide</button>
          <button className="adm-btn adm-btn-sm adm-btn-danger" disabled={bulkBusy} onClick={() => void bulkRemove()}>Delete</button>
          <button className="adm-btn adm-btn-sm" style={{ marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {!loading && !error && (
        <div className="adm-card">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all categories" />
                  </th>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Subcategories</th>
                  <th>Order</th>
                  <th>Visible</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelectOne(c.id)} aria-label={`Select ${c.name}`} />
                    </td>
                    <td>
                      <div className="adm-cell-flex">
                        <Image
                          className="adm-thumb"
                          src={c.image.startsWith("http") ? c.image : fashionSrc(c.image, 84, 104)}
                          alt={c.name}
                          width={42}
                          height={52}
                          unoptimized={c.image.startsWith("http")}
                        />
                        <div>
                          <div className="adm-cell-main">
                            <Link href={`/admin/products?category=${encodeURIComponent(c.name)}`} style={{ color: "inherit" }}>
                              {c.name}
                            </Link>
                            {c.isFeatured && <span className="adm-badge green" style={{ marginLeft: 8 }}>Featured</span>}
                          </div>
                          <div className="adm-cell-sub">{c.description || "No description"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="adm-cell-sub">/{c.slug}</td>
                    <td>
                      <span className="adm-badge slate">{c.productCount}</span>
                    </td>
                    <td>{c.sortOrder}</td>
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
                    <td colSpan={7}>
                      <div className="adm-empty">No categories yet. Create your first one.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <CategoryModal
          draft={editing}
          saving={saving}
          onClose={() => !saving && setEditing(null)}
          onSave={(d, file) => void save(d, file)}
          onUploadImage={(file) => void handleImageUpload(editing.id, file)}
          onRemoveImage={() => void handleImageRemove(editing.id)}
        />
      )}
      <Toast msg={toast} />
      {dialog}
    </>
  );
}

function CategoryModal({
  draft,
  saving,
  onClose,
  onSave,
  onUploadImage,
  onRemoveImage,
}: {
  draft: Draft;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft, imageFile: File | null) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const isNew = !draft.id;

  // Keep the modal's image in sync when the parent updates it after an upload/remove.
  useEffect(() => {
    setD((p) => ({ ...p, imageUrl: draft.imageUrl, image: draft.image }));
  }, [draft.imageUrl, draft.image]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function pickImage(file: File) {
    if (!isNew) {
      onUploadImage(file);
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearStagedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }

  const previewSrc = imagePreview ?? d.imageUrl;

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{isNew ? "New category" : `Edit · ${draft.name}`}</h3>
          <button className="adm-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-field">
            <label>Name</label>
            <input className="adm-input" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Coats" />
          </div>
          <div className="adm-field">
            <label>Slug (display only)</label>
            <input className="adm-input" value={d.slug} readOnly placeholder="auto from name" />
            <span className="adm-hint">Derived from name: /{d.slug || slugify(d.name) || "…"}</span>
          </div>
          <div className="adm-field">
            <label>Description</label>
            <textarea className="adm-textarea" value={d.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Sort order (local display)</label>
              <input className="adm-input" type="number" value={d.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </div>
          </div>
          <div className="adm-switchrow">
            <div className="adm-switchrow-info"><strong>Visible</strong><span>Show this category on the storefront</span></div>
            <Toggle checked={d.visible} onChange={(v) => set("visible", v)} />
          </div>
          <div className="adm-switchrow">
            <div className="adm-switchrow-info"><strong>Featured</strong><span>Highlight on featured sections</span></div>
            <Toggle checked={d.isFeatured} onChange={(v) => set("isFeatured", v)} />
          </div>

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Image</label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 110, height: 138, borderRadius: 8, overflow: "hidden",
                  background: "#f2f2f2", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #e5e5e5", flexShrink: 0,
                }}
              >
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt={d.name || "Category"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                {isNew && imageFile && (
                  <button type="button" className="adm-btn adm-btn-sm" onClick={clearStagedImage}>
                    Clear selected image
                  </button>
                )}
                {!isNew && d.imageUrl && (
                  <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={onRemoveImage}>
                    Remove image
                  </button>
                )}
                <span className="adm-hint">
                  {isNew ? "Uploaded when you create this category." : "Uploads immediately."}
                </span>
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
