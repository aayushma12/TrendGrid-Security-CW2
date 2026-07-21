"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { NexaProductCard } from "@/components/home-nexa/NexaProductCard";
import { EASE, FadeUp, Float } from "@/components/home-nexa/motion";
import { fashionSrc } from "@/lib/fashion-images";
import { listCategories } from "@/lib/api/categories";
import { listProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { formatAuthError } from "@/lib/auth-context";
import type { CategoryDto, ProductDto } from "@/lib/api/types";

type Sort = "featured" | "price-asc" | "price-desc" | "newest";
const PAGE_SIZE = 12;

/** /shop — editorial catalogue: hero band, sticky filter bar, product grid. */
export default function ShopPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listCategories({ isActive: true, limit: 100 })
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [categoryId, sort]);

  const load = useCallback(async () => {
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
      });
      setProducts(res.data);
      setTotal(res.meta?.total ?? res.data.length);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : formatAuthError(err));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCategory = categories.find((c) => c.id === categoryId) ?? null;
  const filtered = categoryId !== "all";
  const clearAll = () => setCategoryId("all");

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
                  <li>Free shipping over $180</li>
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
                onClick={() => setCategoryId("all")}
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
                  onClick={() => setCategoryId(c.id)}
                >
                  {categoryId === c.id && (
                    <motion.span className="nx-pill-bg" layoutId="nx-shop-cat" transition={{ type: "spring", stiffness: 420, damping: 34 }} aria-hidden />
                  )}
                  <span className="nx-pill-label">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="nx-shop-bar-right">
              <label className="nx-select-wrap">
                <span className="nx-select-cap">Sort</span>
                <select
                  className="nx-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
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
          <div className="nx-shop-count">
            <p className="nx-result-note">
              Showing <strong>{products.length}</strong> of {total} styles
            </p>
            <AnimatePresence>
              {filtered && (
                <motion.div
                  className="nx-shop-chips"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {activeCategory && (
                    <button className="nx-fchip" onClick={clearAll}>
                      {activeCategory.name} <span aria-hidden>×</span>
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
                Try a different category.
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="nx-result-note">
                Page {page} of {totalPages}
              </span>
              <button
                className="nx-btn nx-btn-ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
