"use client";

import Image from "next/image";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  bulkDeleteProducts,
  bulkUpdateProductActive,
  createProduct,
  deleteProduct,
  getCatalogStats,
  importProductsCsv,
  listProducts,
  removeProductImage,
  updateProduct,
  updateProductAssignments,
  updateProductFlag,
  uploadProductImage,
  type CatalogStats,
  type ImportSummary,
} from "@/lib/api/products";
import { listAllCategories } from "@/lib/api/categories";
import { formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import type { CategoryDto, ProductColor, ProductDto, ProductImageSlot, ProductStatus } from "@/lib/api/types";
import { Toggle, Toast, useConfirmDialog, useToast, fashionSrc } from "@/components/admin/ui";

const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const STATUS_TONE: Record<ProductStatus, string> = { DRAFT: "amber", PUBLISHED: "green", ARCHIVED: "gray" };
const PAGE_SIZE = 20;
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "basePrice:asc", label: "Price: low to high" },
  { value: "basePrice:desc", label: "Price: high to low" },
];

const IMAGE_SLOTS: { slot: ProductImageSlot; label: string }[] = [
  { slot: "thumbnail", label: "Thumbnail" },
  { slot: "extra1", label: "Extra 1" },
  { slot: "extra2", label: "Extra 2" },
  { slot: "extra3", label: "Extra 3" },
];

const FLAGS: { key: keyof Pick<Draft, "isActive" | "isFeatured" | "isRecommended" | "isTrending" | "isBestSeller" | "isNewArrival">; label: string; hint: string }[] = [
  { key: "isActive", label: "Active", hint: "Visible in the catalog when published" },
  { key: "isFeatured", label: "Featured", hint: "Highlight in featured sections" },
  { key: "isRecommended", label: "Recommended", hint: "Shown in recommended rails" },
  { key: "isTrending", label: "Trending", hint: "Shown in trending rails" },
  { key: "isBestSeller", label: "Best seller", hint: "Shown in best-seller rails" },
  { key: "isNewArrival", label: "New arrival", hint: "Shown in new-arrival rails" },
];

function formatMoney(n: number, currency: string): string {
  return `${currency} ${n.toFixed(2)}`;
}

function arrToText(arr?: string[]): string {
  return (arr ?? []).join(", ");
}
function textToArr(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
const HEX_RE = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
function colorsToText(colors?: ProductColor[]): string {
  return (colors ?? []).map((c) => `${c.name}:${c.hexCode}`).join(", ");
}
function textToColors(s: string): ProductColor[] {
  return s
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [name, hex] = pair.split(":").map((p) => p.trim());
      return { name: name || pair, hexCode: hex && HEX_RE.test(hex) ? hex : "#000000" };
    });
}

interface Draft {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  discountPrice: number;
  currency: string;
  categoryId: string;
  brand: string;
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  sizesText: string;
  colorsText: string;
  tagsText: string;
  labelsText: string;
  collectionsText: string;
  images: ProductDto["images"];
}

const BLANK: Draft = {
  id: "",
  name: "",
  description: "",
  shortDescription: "",
  basePrice: 0,
  discountPrice: 0,
  currency: "NPR",
  categoryId: "",
  brand: "",
  status: "DRAFT",
  isActive: true,
  isFeatured: false,
  isRecommended: false,
  isTrending: false,
  isBestSeller: false,
  isNewArrival: false,
  sizesText: "",
  colorsText: "",
  tagsText: "",
  labelsText: "",
  collectionsText: "",
  images: [],
};

function mapProduct(p: ProductDto): Draft {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    shortDescription: p.shortDescription ?? "",
    basePrice: p.basePrice,
    discountPrice: p.discountPrice ?? 0,
    currency: p.currency,
    categoryId: p.category?.id ?? "",
    brand: p.brand ?? "",
    status: p.status,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isRecommended: p.isRecommended,
    isTrending: p.isTrending,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    sizesText: arrToText(p.sizes),
    colorsText: colorsToText(p.colors),
    tagsText: arrToText(p.tags),
    labelsText: arrToText(p.labels),
    collectionsText: arrToText(p.collections),
    images: p.images,
  };
}

function thumbOf(p: ProductDto): string | null {
  return p.images.find((i) => i.slot === "thumbnail")?.url ?? null;
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: "warn" }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-label">{label}</div>
      <div className="adm-stat-value" style={tone === "warn" && Number(value) > 0 ? { color: "#b45309" } : undefined}>
        {value}
      </div>
    </div>
  );
}

function ProductsInner() {
  const params = useSearchParams();
  const initialCatName = params.get("category");

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catId, setCatId] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [toast, showToast] = useToast();
  const { confirm, dialog } = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sortBy, sortOrder] = sort.split(":") as ["name" | "basePrice" | "createdAt" | "updatedAt", "asc" | "desc"];
      const [prodRes, allCats, statsRes] = await Promise.all([
        listProducts({
          page,
          limit: PAGE_SIZE,
          search: query.trim() || undefined,
          categoryId: catId !== "All" ? catId : undefined,
          sortBy,
          sortOrder,
        }),
        listAllCategories(),
        getCatalogStats().catch(() => null),
      ]);
      setProducts(prodRes.data);
      setTotalPages(prodRes.meta?.totalPages ?? 1);
      setTotal(prodRes.meta?.total ?? prodRes.data.length);
      setCategories(allCats);
      if (statsRes) setStats(statsRes.data);
      setSelected(new Set());
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }, [page, query, catId, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!initialCatName || categories.length === 0) return;
    const match = categories.find((c) => c.name === initialCatName);
    if (match) setCatId(match.id);
  }, [categories, initialCatName]);

  // Any filter/search/sort change should reset back to page 1.
  useEffect(() => {
    setPage(1);
  }, [catId, query, sort]);

  const allSelectedOnPage = products.length > 0 && products.every((p) => selected.has(p.id));

  function toggleSelectAll() {
    setSelected(allSelectedOnPage ? new Set() : new Set(products.map((p) => p.id)));
  }
  function toggleSelectOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleFeatured(p: ProductDto, v: boolean) {
    const prev = products;
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, isFeatured: v } : x)));
    try {
      const res = await updateProductFlag(p.id, "isFeatured", v);
      setProducts((list) => list.map((x) => (x.id === p.id ? res.data : x)));
      showToast(v ? `“${p.name}” featured` : `“${p.name}” unfeatured`);
    } catch (err) {
      setProducts(prev);
      showToast(formatAuthError(err));
    }
  }

  async function remove(p: ProductDto) {
    if (
      !(await confirm({ message: `Delete "${p.name}"? This cannot be undone.`, confirmLabel: "Delete", danger: true }))
    )
      return;
    try {
      await deleteProduct(p.id);
      showToast(`“${p.name}” deleted`);
      void load();
    } catch (err) {
      showToast(formatAuthError(err));
    }
  }

  async function bulkActivate(isActive: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await bulkUpdateProductActive(ids, isActive);
      showToast(`${res.data.updated} product${res.data.updated === 1 ? "" : "s"} ${isActive ? "activated" : "deactivated"}`);
      void load();
    } catch (err) {
      showToast(formatAuthError(err));
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!(await confirm({ message: `Delete ${ids.length} selected product${ids.length === 1 ? "" : "s"}? This cannot be undone.`, confirmLabel: "Delete", danger: true })))
      return;
    setBulkBusy(true);
    try {
      const res = await bulkDeleteProducts(ids);
      showToast(`${res.data.updated} product${res.data.updated === 1 ? "" : "s"} deleted`);
      void load();
    } catch (err) {
      showToast(formatAuthError(err));
    } finally {
      setBulkBusy(false);
    }
  }

  async function save(draft: Draft, thumbnailFile: File | null) {
    if (!draft.categoryId) {
      showToast("Please choose a category");
      return;
    }
    setSaving(true);
    try {
      const core = {
        name: draft.name,
        description: draft.description || undefined,
        shortDescription: draft.shortDescription || undefined,
        basePrice: draft.basePrice,
        discountPrice: draft.discountPrice || undefined,
        currency: draft.currency || undefined,
        categoryId: draft.categoryId,
        brand: draft.brand || undefined,
        status: draft.status,
        isActive: draft.isActive,
        isFeatured: draft.isFeatured,
        isRecommended: draft.isRecommended,
        isTrending: draft.isTrending,
        isBestSeller: draft.isBestSeller,
        isNewArrival: draft.isNewArrival,
        image: thumbnailFile ?? undefined,
      };
      const assignments = {
        sizes: textToArr(draft.sizesText),
        colors: textToColors(draft.colorsText),
        tags: textToArr(draft.tagsText),
        labels: textToArr(draft.labelsText),
        collections: textToArr(draft.collectionsText),
      };

      if (draft.id) {
        await updateProduct(draft.id, core);
        await updateProductAssignments(draft.id, assignments);
        showToast(`“${draft.name}” updated`);
      } else {
        const res = await createProduct(core);
        await updateProductAssignments(res.data.id, assignments);
        showToast(`“${draft.name}” created`);
      }
      setEditing(null);
      void load();
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

  async function handleSlotUpload(productId: string, slot: ProductImageSlot, file: File) {
    try {
      const res = await uploadProductImage(productId, slot, file);
      setProducts((prev) => prev.map((p) => (p.id === productId ? res.data : p)));
      setEditing((e) => (e && e.id === productId ? mapProduct(res.data) : e));
      showToast(`Image uploaded · ${slot}`);
    } catch (err) {
      showToast(formatAuthError(err));
    }
  }

  async function handleSlotRemove(productId: string, slot: ProductImageSlot) {
    try {
      const res = await removeProductImage(productId, slot);
      setProducts((prev) => prev.map((p) => (p.id === productId ? res.data : p)));
      setEditing((e) => (e && e.id === productId ? mapProduct(res.data) : e));
      showToast(`Image removed · ${slot}`);
    } catch (err) {
      showToast(formatAuthError(err));
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h2>Products</h2>
          <p>Loaded from the Trendgrid API. {catId === "All" ? "All products across every category." : `Products in “${categories.find((c) => c.id === catId)?.name ?? ""}”.`}</p>
        </div>
        <div className="adm-head-actions">
          <input className="adm-search" placeholder="Search name or brand…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 170 }}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="adm-btn" onClick={() => void load()} disabled={loading}>Refresh</button>
          <button className="adm-btn" onClick={() => setImporting(true)}>Import CSV</button>
          <button
            className="adm-btn adm-btn-primary"
            onClick={() => setEditing({ ...BLANK, categoryId: catId !== "All" ? catId : categories[0]?.id ?? "" })}
            disabled={loading || categories.length === 0}
          >
            + Add product
          </button>
        </div>
      </div>

      {stats && (
        <div className="adm-stats">
          <StatCard label="Total products" value={stats.totalProducts} />
          <StatCard label="Active" value={stats.activeProducts} />
          <StatCard label="Inactive" value={stats.inactiveProducts} />
          <StatCard label="Added (30d)" value={stats.recentlyAdded} />
          <StatCard label="Low stock variants" value={stats.lowStockVariants} tone="warn" />
        </div>
      )}

      <div className="adm-pills">
        <button className={`adm-pill${catId === "All" ? " is-active" : ""}`} onClick={() => setCatId("All")}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.id} className={`adm-pill${catId === c.id ? " is-active" : ""}`} onClick={() => setCatId(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="adm-card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <strong>{selected.size} selected</strong>
          <button className="adm-btn adm-btn-sm" disabled={bulkBusy} onClick={() => void bulkActivate(true)}>Activate</button>
          <button className="adm-btn adm-btn-sm" disabled={bulkBusy} onClick={() => void bulkActivate(false)}>Deactivate</button>
          <button className="adm-btn adm-btn-sm adm-btn-danger" disabled={bulkBusy} onClick={() => void bulkDelete()}>Delete</button>
          <button className="adm-btn adm-btn-sm" style={{ marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {loading && (
        <div className="adm-card">
          <div className="adm-empty">Loading products from API…</div>
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
                  <th style={{ width: 32 }}>
                    <input type="checkbox" checked={allSelectedOnPage} onChange={toggleSelectAll} aria-label="Select all on this page" />
                  </th>
                  <th>Product</th><th>Category</th><th>Price</th><th>Variants</th><th>Status</th><th>Featured</th><th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const thumb = thumbOf(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelectOne(p.id)} aria-label={`Select ${p.name}`} />
                      </td>
                      <td>
                        <div className="adm-cell-flex">
                          <Image
                            className="adm-thumb"
                            src={thumb ?? fashionSrc(p.id, 84, 104)}
                            alt={p.name}
                            width={42}
                            height={52}
                            unoptimized={Boolean(thumb)}
                          />
                          <div>
                            <div className="adm-cell-main">{p.name}</div>
                            <div className="adm-cell-sub">{p.brand || "No brand"}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="adm-badge slate">{p.category?.name ?? "Uncategorized"}</span></td>
                      <td>
                        <div className="adm-cell-main">{formatMoney(p.basePrice, p.currency)}</div>
                        {p.discountPrice !== null && p.discountPrice < p.basePrice && (
                          <div className="adm-cell-sub" style={{ textDecoration: "line-through" }}>{formatMoney(p.discountPrice, p.currency)}</div>
                        )}
                      </td>
                      <td><span className="adm-badge slate">{p.variantsCount ?? p.variants?.length ?? 0}</span></td>
                      <td><span className={`adm-badge ${STATUS_TONE[p.status]}`}>{p.status}</span></td>
                      <td><Toggle checked={p.isFeatured} onChange={(v) => void toggleFeatured(p, v)} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="adm-btn adm-btn-sm" onClick={() => setEditing(mapProduct(p))}>Edit</button>
                          <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => void remove(p)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr><td colSpan={8}><div className="adm-empty">No products match. Try another category or search.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <span className="adm-cell-sub">{total} product{total === 1 ? "" : "s"} total · page {page} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-btn adm-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="adm-btn adm-btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <ProductModal
          draft={editing}
          categories={categories}
          saving={saving}
          onClose={() => !saving && setEditing(null)}
          onSave={(d, file) => void save(d, file)}
          onUploadImage={(slot, file) => void handleSlotUpload(editing.id, slot, file)}
          onRemoveImage={(slot) => void handleSlotRemove(editing.id, slot)}
        />
      )}
      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onDone={() => {
            setImporting(false);
            void load();
          }}
        />
      )}
      <Toast msg={toast} />
      {dialog}
    </>
  );
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runPreview() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await importProductsCsv(file, true);
      setPreview(res.data);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await importProductsCsv(file, false);
      onDone();
    } catch (err) {
      setError(formatAuthError(err));
      setBusy(false);
    }
  }

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>Import products from CSV</h3>
          <button className="adm-close" onClick={onClose} disabled={busy}>✕</button>
        </div>
        <div className="adm-modal-body">
          <p className="adm-hint">
            Columns: name, description, shortDescription, basePrice, discountPrice, currency, categoryName,
            brand, sizes, tags, labels, collections. Sizes/tags/labels/collections are comma-separated within
            their cell (e.g. &quot;S,M,L&quot;). categoryName must match an existing category or subcategory name exactly.
          </p>
          <div className="adm-field">
            <label>CSV file</label>
            <input
              className="adm-input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null);
              }}
            />
          </div>

          {error && (
            <div role="alert" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 14 }}>
              {error}
            </div>
          )}

          {preview && (
            <div className="adm-card" style={{ marginTop: 12, padding: 12 }}>
              <p>
                <strong>{preview.created}</strong> would be created, <strong>{preview.skipped}</strong> skipped as
                duplicates, <strong>{preview.errors}</strong> row error{preview.errors === 1 ? "" : "s"}.
              </p>
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                <table className="adm-table">
                  <thead><tr><th>Row</th><th>Name</th><th>Status</th><th>Message</th></tr></thead>
                  <tbody>
                    {preview.results.map((r) => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td>{r.name ?? "—"}</td>
                        <td>
                          <span className={`adm-badge ${r.status === "created" ? "green" : r.status === "error" ? "red" : "amber"}`}>
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="adm-cell-sub">{r.message ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="adm-btn" disabled={!file || busy} onClick={() => void runPreview()}>
            {busy && !preview ? "Checking…" : "Preview (dry run)"}
          </button>
          <button className="adm-btn adm-btn-primary" disabled={!file || busy || !preview} onClick={() => void runImport()}>
            {busy && preview ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({
  draft,
  categories,
  saving,
  onClose,
  onSave,
  onUploadImage,
  onRemoveImage,
}: {
  draft: Draft;
  categories: CategoryDto[];
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft, thumbnailFile: File | null) => void;
  onUploadImage: (slot: ProductImageSlot, file: File) => void;
  onRemoveImage: (slot: ProductImageSlot) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const isNew = !draft.id;

  // Keep the modal's image list in sync when the parent updates it after a slot upload/remove.
  useEffect(() => {
    setD((p) => ({ ...p, images: draft.images }));
  }, [draft.images]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  function pickThumbnail(file: File) {
    if (!isNew) {
      onUploadImage("thumbnail", file);
      return;
    }
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  function clearStagedThumbnail() {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  }

  const thumbnailUrl = d.images.find((i) => i.slot === "thumbnail")?.url ?? null;

  return (
    <div className="adm-overlay adm-modal-center" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{isNew ? "Add product" : `Edit · ${draft.name}`}</h3>
          <button className="adm-close" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-field">
            <label>Name</label>
            <input className="adm-input" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Trendy Brown Coat" />
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Category</label>
              <select className="adm-select" value={d.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="" disabled>Select a category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="adm-field">
              <label>Brand</label>
              <input className="adm-input" value={d.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="adm-field">
            <label>Short description</label>
            <input className="adm-input" value={d.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-line summary shown on listing cards" />
          </div>
          <div className="adm-field">
            <label>Description</label>
            <textarea className="adm-textarea" value={d.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="adm-form-row">
            <div className="adm-field"><label>Base price</label><input className="adm-input" type="number" min={0} step="0.01" value={d.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} /></div>
            <div className="adm-field"><label>Discount price</label><input className="adm-input" type="number" min={0} step="0.01" value={d.discountPrice} onChange={(e) => set("discountPrice", Number(e.target.value))} /></div>
          </div>
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Currency</label>
              <input className="adm-input" value={d.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} placeholder="NPR" />
            </div>
            <div className="adm-field">
              <label>Status</label>
              <select className="adm-select" value={d.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="adm-field">
            <label>Sizes (comma separated)</label>
            <input className="adm-input" value={d.sizesText} onChange={(e) => set("sizesText", e.target.value)} placeholder="S, M, L, XL" />
          </div>
          <div className="adm-field">
            <label>Colors (name:hex, comma separated)</label>
            <input className="adm-input" value={d.colorsText} onChange={(e) => set("colorsText", e.target.value)} placeholder="Black:#101828, Camel:#C9B295" />
            <span className="adm-hint">Applied after save via the assignments endpoint.</span>
          </div>
          <div className="adm-field">
            <label>Tags (comma separated)</label>
            <input className="adm-input" value={d.tagsText} onChange={(e) => set("tagsText", e.target.value)} placeholder="winter, outerwear" />
          </div>
          <div className="adm-form-row">
            <div className="adm-field"><label>Labels (comma separated)</label><input className="adm-input" value={d.labelsText} onChange={(e) => set("labelsText", e.target.value)} placeholder="Limited edition" /></div>
            <div className="adm-field"><label>Collections (comma separated)</label><input className="adm-input" value={d.collectionsText} onChange={(e) => set("collectionsText", e.target.value)} placeholder="Summer 2026" /></div>
          </div>

          {FLAGS.map((f) => (
            <div className="adm-switchrow" key={f.key}>
              <div className="adm-switchrow-info"><strong>{f.label}</strong><span>{f.hint}</span></div>
              <Toggle checked={d[f.key]} onChange={(v) => set(f.key, v)} />
            </div>
          ))}

          <div className="adm-field" style={{ marginTop: 8 }}>
            <label>Images</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {IMAGE_SLOTS.map(({ slot, label }) => {
                const existing = d.images.find((i) => i.slot === slot)?.url ?? null;
                const preview = slot === "thumbnail" && isNew ? thumbnailPreview : null;
                const src = preview ?? existing;
                const disabled = slot !== "thumbnail" && isNew;
                return (
                  <div key={slot} style={{ width: 110 }}>
                    <div
                      style={{
                        width: 110, height: 138, borderRadius: 8, overflow: "hidden",
                        background: "#f2f2f2", display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid #e5e5e5",
                      }}
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 11, color: "#9a9a9a" }}>No image</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, margin: "4px 0" }}>{label}</div>
                    <input
                      className="adm-input"
                      type="file"
                      accept="image/*"
                      disabled={disabled}
                      style={{ fontSize: 11, padding: 4 }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        if (slot === "thumbnail") pickThumbnail(file);
                        else onUploadImage(slot, file);
                      }}
                    />
                    {existing && !disabled && (
                      <button
                        type="button"
                        className="adm-btn adm-btn-sm adm-btn-danger"
                        style={{ marginTop: 4, width: "100%" }}
                        onClick={() => onRemoveImage(slot)}
                      >
                        Remove
                      </button>
                    )}
                    {slot === "thumbnail" && isNew && thumbnailFile && (
                      <button
                        type="button"
                        className="adm-btn adm-btn-sm"
                        style={{ marginTop: 4, width: "100%" }}
                        onClick={clearStagedThumbnail}
                      >
                        Clear selected
                      </button>
                    )}
                    {disabled && <span className="adm-hint">Save first</span>}
                  </div>
                );
              })}
            </div>
            {thumbnailUrl === null && !thumbnailPreview && (
              <span className="adm-hint">Add a thumbnail — it appears in the catalog and product listings.</span>
            )}
          </div>
        </div>
        <div className="adm-modal-foot">
          <button className="adm-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="adm-btn adm-btn-primary"
            disabled={!d.name.trim() || !d.categoryId || d.basePrice <= 0 || saving}
            onClick={() => onSave(d, thumbnailFile)}
          >
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsAdmin() {
  return (
    <Suspense fallback={<div className="adm-empty">Loading products…</div>}>
      <ProductsInner />
    </Suspense>
  );
}
