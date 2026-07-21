"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { resolveImage } from "@/lib/fashion-images";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/shop-data";
import { listProducts } from "@/lib/api/products";
import { cardPrice, productThumbnail } from "@/lib/product-helpers";
import type { ProductDto } from "@/lib/api/types";
import { EASE } from "./motion";

/** Full-screen search overlay driven by store-context searchOpen. Hits the real product search API. */
export function NexaSearch() {
  const { searchOpen, closeSearch } = useStore();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!searchOpen) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [searchOpen, closeSearch]);

  // Debounced real search — "Trending now" (no term) or filtered by name/tag/category.
  useEffect(() => {
    if (!searchOpen) return;
    const thisRequest = ++requestId.current;
    const term = q.trim();
    setLoading(true);
    const t = setTimeout(() => {
      void listProducts({ search: term || undefined, limit: term ? 6 : 4, isActive: true })
        .then((res) => {
          if (requestId.current === thisRequest) setResults(res.data);
        })
        .catch(() => {
          if (requestId.current === thisRequest) setResults([]);
        })
        .finally(() => {
          if (requestId.current === thisRequest) setLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q, searchOpen]);

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="nx nx-search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeSearch}
        >
          <motion.div
            className="nx-search-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Search products"
          >
            <div className="nx-search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search coats, dresses, shirts…"
                aria-label="Search"
              />
              <button className="nx-search-close" onClick={closeSearch} aria-label="Close search">
                Esc
              </button>
            </div>

            <p className="nx-search-label">
              {loading ? "Searching…" : q.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Trending now"}
            </p>

            {!loading && results.length === 0 ? (
              <div className="nx-empty" style={{ padding: "32px 20px" }}>
                <strong>Nothing found</strong>
                Try “coat”, “dress”, or “shirt”.
              </div>
            ) : (
              <ul className="nx-search-results">
                {results.map((p) => {
                  const { price } = cardPrice(p);
                  return (
                    <li key={p.id}>
                      <Link href={`/shop/${p.id}`} onClick={closeSearch}>
                        <span className="nx-mini-img">
                          <Image src={resolveImage(productThumbnail(p), p.name || p.id, 92, 112)} alt="" width={46} height={56} />
                        </span>
                        <span>
                          <b>{p.name}</b>
                          <small>{p.category?.name ?? "Trendgrid"}{p.brand ? ` · ${p.brand}` : ""}</small>
                        </span>
                        <span className="nx-mini-price">{formatPrice(price)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
