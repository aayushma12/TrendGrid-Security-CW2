"use client";

/**
 * Live search overlay (Section 7).
 *
 * Instant product results as the user types (debounced, hits /api/search),
 * full keyboard navigation (↑/↓/Enter/Esc), and skeleton rows while loading.
 * Opened from the header search action or Cmd/Ctrl+K (wired in StoreChrome).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/lib/store-context";

interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: string;
  thumb: string;
}

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(-1);
  const [searched, setSearched] = useState(false);

  /* focus the input shortly after opening (after the drop animation) */
  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    // reset on close
    setQuery("");
    setProducts([]);
    setCategories([]);
    setFocused(-1);
    setSearched(false);
  }, [searchOpen]);

  const fetchResults = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setCategories(data.categories ?? []);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
      setSearched(true);
      setFocused(-1);
    }
  }, []);

  const onInput = (value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      setProducts([]);
      setCategories([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    timer.current = setTimeout(() => fetchResults(q), 280);
  };

  const goTo = useCallback(
    (slug: string) => {
      closeSearch();
      router.push(`/shop/${slug}`);
    },
    [router, closeSearch],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((i) => Math.min(products.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && focused >= 0 && products[focused]) {
      e.preventDefault();
      goTo(products[focused].slug);
    }
  };

  if (!searchOpen) return null;

  return (
    <div
      className="search-overlay is-open"
      role="dialog"
      aria-label="Search"
      aria-modal="true"
      onKeyDown={onKeyDown}
    >
      <div className="search-overlay__backdrop" onClick={closeSearch} />
      <div className="search-overlay__box">
        <div className="search-overlay__bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            className="search-overlay__input"
            placeholder="Search products, brands…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => onInput(e.target.value)}
          />
          <button type="button" className="icon-btn icon-btn--sm" onClick={closeSearch} aria-label="Close search">
            ✕
          </button>
        </div>

        <div className="search-overlay__results" id="searchResults">
          {loading && (
            <>
              {Array.from({ length: 4 }, (_, i) => (
                <div className="search-skel-row" key={i} aria-hidden>
                  <div className="pcard-skel__img" />
                  <div className="search-skel-lines">
                    <div className="pcard-skel__line" />
                    <div className="pcard-skel__line pcard-skel__line--short" />
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && categories.length > 0 && (
            <>
              <p className="search-result-group-title">Categories</p>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="search-result-item"
                  onClick={() => {
                    closeSearch();
                    router.push(`/shop?category=${encodeURIComponent(c)}`);
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 600, fontSize: ".9rem" }}>{c}</span>
                </button>
              ))}
            </>
          )}

          {!loading && products.length > 0 && (
            <>
              <p className="search-result-group-title">Products</p>
              {products.map((p, i) => (
                <a
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className={`search-result-item${i === focused ? " is-focused" : ""}`}
                  data-index={i}
                  onMouseEnter={() => setFocused(i)}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(p.slug);
                  }}
                >
                  <div className="pimg" style={{ width: 52, height: 64, borderRadius: 8, flexShrink: 0, overflow: "hidden" }}>
                    <Image src={p.thumb} alt={p.name} width={52} height={64} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: ".9rem", margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: ".78rem", color: "var(--color-text-muted)", margin: ".15rem 0 0" }}>{p.category}</p>
                  </div>
                  <span className="price__now" style={{ flexShrink: 0 }}>{p.price}</span>
                </a>
              ))}
            </>
          )}

          {!loading && searched && products.length === 0 && (
            <p className="search-overlay__empty">No results for &ldquo;{query}&rdquo;</p>
          )}
          {!loading && !searched && (
            <p className="search-overlay__empty">Type at least 2 characters to search</p>
          )}
        </div>

        <div className="search-overlay__foot">
          <span style={{ fontSize: ".75rem", color: "var(--color-text-muted)" }}>
            Press <kbd>Esc</kbd> to close · <kbd>↑↓</kbd> to navigate · <kbd>Enter</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}
