"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { NexaProductCard } from "@/components/home-nexa/NexaProductCard";
import { EASE, FadeUp, Float } from "@/components/home-nexa/motion";
import { Filters, FilterDrawer } from "@/components/storefront/FilterSidebar";
import { fashionSrc } from "@/lib/fashion-images";
import { listAllCategories } from "@/lib/api/categories";
import { listProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { formatAuthError } from "@/lib/auth-context";
import { FILTER_COLORS, FILTER_GENDERS, FILTER_SIZES } from "@/lib/shop-data";
import type { CategoryDto, ProductDto } from "@/lib/api/types";

type Sort = "featured" | "price-asc" | "price-desc" | "newest";
const PAGE_SIZE = 12;

/** Applies a mutation to a copy of the current URL params and pushes it, without adding a history entry per filter click. */
function useUrlFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      if (resetPage) next.delete("page");
      router.replace(`/shop?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return { searchParams, update };
}

function toggleMultiValue(params: URLSearchParams, key: string, value: string) {
  const current = params.getAll(key);
  params.delete(key);
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  next.forEach((v) => params.append(key, v));
}

/** /shop — editorial catalogue: hero band, sticky filter bar, sidebar + drawer filters, product grid. */
function ShopInner() {
  const { searchParams, update } = useUrlFilters();

  const categoryId = searchParams.get("category") ?? "all";
  const sort = (searchParams.get("sort") as Sort | null) ?? "featured";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";
  const colors = useMemo(() => searchParams.getAll("color"), [searchParams]);
  const sizes = useMemo(() => searchParams.getAll("size"), [searchParams]);
  const genders = useMemo(() => searchParams.getAll("gender"), [searchParams]);
  const onSale = searchParams.get("onSale") === "true";
  const inStock = searchParams.get("inStock") === "true";

  // Local, debounced mirror of the price inputs — avoids firing a request on every keystroke.
  const [minPriceInput, setMinPriceInput] = useState(urlMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(urlMaxPrice);
  useEffect(() => {
    setMinPriceInput(urlMinPrice);
    setMaxPriceInput(urlMaxPrice);
  }, [urlMinPrice, urlMaxPrice]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (minPriceInput === urlMinPrice && maxPriceInput === urlMaxPrice) return;
      update((p) => {
        if (minPriceInput) p.set("minPrice", minPriceInput);
        else p.delete("minPrice");
        if (maxPriceInput) p.set("maxPrice", maxPriceInput);
        else p.delete("maxPrice");
      });
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceInput, maxPriceInput]);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Top-level categories only — the pill bar is a category *type* switcher,
  // not a flat dump of all ~150 subcategories. Filtering by one now actually
  // returns its subcategories' products too (see the API's category service).
  useEffect(() => {
    void listAllCategories({ isActive: true, parentCategoryId: null })
      .then((all) => setCategories(all))
      .catch(() => setCategories([]));
  }, []);

  // Every filter tweak fires a new request while an earlier one (e.g. the
  // initial unfiltered load) may still be in flight — with no ordering
  // guard, a slower stale response can resolve last and silently overwrite
  // a newer, correctly-filtered one. This id lets a response recognize
  // it's stale and no-op instead.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      // "featured" has no dedicated backend sort field — it falls back to
      // newest-first. Product ratings live on reviews, not the product list,
      // so there is no server-side "top rated" sort either.
      const sortBy = sort === "price-asc" || sort === "price-desc" ? "basePrice" : "createdAt";
      const sortOrder = sort === "price-asc" ? "asc" : "desc";
      const res = await listProducts({
        page,
        limit: PAGE_SIZE,
        categoryId: categoryId === "all" ? undefined : categoryId,
        isActive: true,
        sortBy,
        sortOrder,
        priceMin: urlMinPrice ? Number(urlMinPrice) : undefined,
        priceMax: urlMaxPrice ? Number(urlMaxPrice) : undefined,
        color: colors.length ? colors : undefined,
        size: sizes.length ? sizes : undefined,
        label: genders.length ? genders : undefined,
        onSale: onSale ? true : undefined,
        inStock: inStock ? true : undefined,
      });
      if (requestIdRef.current !== requestId) return;
      setProducts(res.data);
      setTotal(res.meta?.total ?? res.data.length);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
      setProducts([]);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [page, categoryId, sort, urlMinPrice, urlMaxPrice, colors, sizes, genders, onSale, inStock]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCategory = categories.find((c) => c.id === categoryId) ?? null;
  const hasAnyFilter =
    categoryId !== "all" || colors.length > 0 || sizes.length > 0 || genders.length > 0 ||
    onSale || inStock || Boolean(urlMinPrice) || Boolean(urlMaxPrice);
  const clearAll = () => update((p) => { p.forEach((_, k) => p.delete(k)); }, false);

  const filtersProps = {
    colors: FILTER_COLORS,
    sizes: FILTER_SIZES,
    genders: FILTER_GENDERS,
    activeColors: colors,
    activeSizes: sizes,
    activeGenders: genders,
    minPrice: minPriceInput,
    maxPrice: maxPriceInput,
    onSale,
    inStock,
    onToggleColor: (c: string) => update((p) => toggleMultiValue(p, "color", c)),
    onToggleSize: (s: string) => update((p) => toggleMultiValue(p, "size", s)),
    onToggleGender: (g: string) => update((p) => toggleMultiValue(p, "gender", g)),
    onMinPrice: setMinPriceInput,
    onMaxPrice: setMaxPriceInput,
    onToggleOnSale: () => update((p) => (onSale ? p.delete("onSale") : p.set("onSale", "true"))),
    onToggleInStock: () => update((p) => (inStock ? p.delete("inStock") : p.set("inStock", "true"))),
  };

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-shop-page">
        {/* -------- editorial hero band -------- */}
        <section className="nx-shop-hero">
          <div className="nx-hero-glow" aria-hidden />
          <div className="nx-container nx-shop-hero-inner">
            <div className="nx-shop-hero-copy">
              <nav className="nx-crumbs" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span aria-hidden>/</span>
                <span>Shop</span>
              </nav>
              <FadeUp>
                <span className="nx-eyebrow nx-cat-eyebrow">New Season 2026</span>
                <h1 className="nx-shop-title">
                  The <em>Collection</em>
                </h1>
                <p className="nx-sub nx-shop-lede">
                  Curated wardrobe essentials — premium fabrics, timeless cuts and
                  colours made to layer, season after season.
                </p>
                <ul className="nx-shop-hero-meta">
                  <li><strong>{total}</strong> styles</li>
                  <li>Free shipping over Rs. 5,000</li>
                  <li>30-day easy returns</li>
                </ul>
              </FadeUp>
            </div>

            <div className="nx-shop-hero-art" aria-hidden>
              <Float amount={8} duration={5.4} className="nx-shop-art is-a">
                <Image src={fashionSrc("editorial coat", 360, 460)} alt="" width={360} height={460} />
              </Float>
              <Float amount={7} duration={6.2} className="nx-shop-art is-b">
                <Image src={fashionSrc("dress lookbook", 300, 380)} alt="" width={300} height={380} />
              </Float>
              <span className="nx-shop-art-badge">
                <span className="nx-chip-icon is-check" aria-hidden>✦</span>
                Editor’s Picks
              </span>
            </div>
          </div>
        </section>

        {/* -------- sticky filter bar -------- */}
        <div className="nx-shop-bar">
          <div className="nx-container nx-shop-bar-inner">
            <div className="nx-pills nx-shop-pills" role="tablist" aria-label="Categories">
              <button
                role="tab"
                aria-selected={categoryId === "all"}
                className={`nx-pill${categoryId === "all" ? " is-active" : ""}`}
                onClick={() => update((p) => p.delete("category"))}
              >
                {categoryId === "all" && (
                  <motion.span className="nx-pill-bg" layoutId="nx-shop-cat" transition={{ type: "spring", stiffness: 420, damping: 34 }} aria-hidden />
                )}
                <span className="nx-pill-label">All Styles</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={categoryId === c.id}
                  className={`nx-pill${categoryId === c.id ? " is-active" : ""}`}
                  onClick={() => update((p) => p.set("category", c.id))}
                >
                  {categoryId === c.id && (
                    <motion.span className="nx-pill-bg" layoutId="nx-shop-cat" transition={{ type: "spring", stiffness: 420, damping: 34 }} aria-hidden />
                  )}
                  <span className="nx-pill-label">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="nx-shop-bar-right">
              <button
                id="filterTrigger"
                type="button"
                className="nx-btn nx-btn-ghost"
                onClick={() => setDrawerOpen(true)}
              >
                Filters{hasAnyFilter && !loading ? ` (${colors.length + sizes.length + genders.length + (onSale ? 1 : 0) + (inStock ? 1 : 0) + (urlMinPrice || urlMaxPrice ? 1 : 0)})` : ""}
              </button>
              <label className="nx-select-wrap">
                <span className="nx-select-cap">Sort</span>
                <select
                  className="nx-select"
                  value={sort}
                  onChange={(e) => update((p) => p.set("sort", e.target.value))}
                  aria-label="Sort products"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* -------- results -------- */}
        <div className="nx-container nx-shop-body">
          <div className="shop-layout">
            <Filters {...filtersProps} />

            <div>
              <div className="nx-shop-count">
                <p className="nx-result-note">
                  Showing <strong>{products.length}</strong> of {total} styles
                </p>
                <AnimatePresence>
                  {hasAnyFilter && (
                    <motion.div
                      className="nx-shop-chips"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      {activeCategory && (
                        <button className="nx-fchip" onClick={() => update((p) => p.delete("category"))}>
                          {activeCategory.name} <span aria-hidden>×</span>
                        </button>
                      )}
                      {colors.map((c) => (
                        <button key={`c-${c}`} className="nx-fchip" onClick={() => update((p) => toggleMultiValue(p, "color", c))}>
                          {c} <span aria-hidden>×</span>
                        </button>
                      ))}
                      {sizes.map((s) => (
                        <button key={`s-${s}`} className="nx-fchip" onClick={() => update((p) => toggleMultiValue(p, "size", s))}>
                          Size {s} <span aria-hidden>×</span>
                        </button>
                      ))}
                      {genders.map((g) => (
                        <button key={`g-${g}`} className="nx-fchip" onClick={() => update((p) => toggleMultiValue(p, "gender", g))}>
                          {g} <span aria-hidden>×</span>
                        </button>
                      ))}
                      {onSale && (
                        <button className="nx-fchip" onClick={() => update((p) => p.delete("onSale"))}>
                          On sale <span aria-hidden>×</span>
                        </button>
                      )}
                      {inStock && (
                        <button className="nx-fchip" onClick={() => update((p) => p.delete("inStock"))}>
                          In stock <span aria-hidden>×</span>
                        </button>
                      )}
                      {(urlMinPrice || urlMaxPrice) && (
                        <button className="nx-fchip" onClick={() => update((p) => { p.delete("minPrice"); p.delete("maxPrice"); })}>
                          Rs. {urlMinPrice || "0"}–{urlMaxPrice || "∞"} <span aria-hidden>×</span>
                        </button>
                      )}
                      <button className="nx-fclear" onClick={clearAll}>Clear all</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error ? (
                <FadeUp>
                  <div className="nx-empty">
                    <strong>Couldn’t load products</strong>
                    {error}
                    <button className="nx-btn nx-btn-ghost nx-empty-btn" onClick={() => void load()}>
                      Try again
                    </button>
                  </div>
                </FadeUp>
              ) : !loading && products.length === 0 ? (
                <FadeUp>
                  <div className="nx-empty">
                    <strong>No styles match those filters</strong>
                    Try removing a filter or two.
                    <button className="nx-btn nx-btn-ghost nx-empty-btn" onClick={clearAll}>
                      Clear filters
                    </button>
                  </div>
                </FadeUp>
              ) : (
                <motion.div className="nx-grid-3 nx-shop-grid" layout>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {products.map((p, i) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 28, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.55, delay: (i % 3) * 0.09, ease: EASE }}
                      >
                        <NexaProductCard p={p} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {totalPages > 1 && (
                <div className="nx-shop-pager">
                  <button
                    className="nx-btn nx-btn-ghost"
                    disabled={page <= 1}
                    onClick={() => update((p) => p.set("page", String(Math.max(1, page - 1))), false)}
                  >
                    Previous
                  </button>
                  <span className="nx-result-note">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="nx-btn nx-btn-ghost"
                    disabled={page >= totalPages}
                    onClick={() => update((p) => p.set("page", String(Math.min(totalPages, page + 1))), false)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onClearAll={clearAll}
        filtersProps={filtersProps}
      />

      <NexaFooter />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopInner />
    </Suspense>
  );
}
