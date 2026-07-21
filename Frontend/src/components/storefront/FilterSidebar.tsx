"use client";

/**
 * Filter sidebar + mobile drawer (Section 4).
 *
 * `Filters` is a controlled panel reused in both the desktop sidebar and the
 * mobile drawer. Each group is collapsible (chevron toggle) and its open/closed
 * state persists per group key in sessionStorage. `FilterDrawer` wraps the same
 * panel in a slide-in dialog for < 1024px.
 */

import { useEffect, useState, type ReactNode } from "react";

function Chevron() {
  return (
    <svg
      className="filter-chevron"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** A collapsible filter group whose open state persists in sessionStorage. */
function FilterGroup({
  title,
  groupKey,
  children,
}: {
  title: string;
  groupKey: string;
  children: ReactNode;
}) {
  const storeKey = `ndh.filter.${groupKey}`;
  const [open, setOpen] = useState(true);

  // restore persisted state after mount (default: open)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(storeKey);
    if (saved !== null) setOpen(saved === "true");
  }, [storeKey]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.sessionStorage.setItem(storeKey, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="filter-group" data-open={open}>
      <h3
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {title}
        <Chevron />
      </h3>
      {children}
    </div>
  );
}

export interface FiltersProps {
  categories: string[];
  colors: string[];
  sizes: string[];
  activeCategories: string[];
  activeColors: string[];
  activeSizes: string[];
  maxPrice: number;
  priceCeiling?: number;
  onToggleCategory: (c: string) => void;
  onToggleColor: (c: string) => void;
  onToggleSize: (s: string) => void;
  onMaxPrice: (n: number) => void;
  showTitle?: boolean;
}

export function Filters({
  categories,
  colors,
  sizes,
  activeCategories,
  activeColors,
  activeSizes,
  maxPrice,
  priceCeiling = 300,
  onToggleCategory,
  onToggleColor,
  onToggleSize,
  onMaxPrice,
  showTitle = true,
}: FiltersProps) {
  return (
    <aside className="filters" aria-label="Filter options">
      {showTitle && <h2>Filter Options</h2>}

      <FilterGroup title="Category" groupKey="category">
        {categories.map((cat) => (
          <label key={cat} className="check">
            <input
              type="checkbox"
              checked={activeCategories.includes(cat)}
              onChange={() => onToggleCategory(cat)}
            />
            {cat}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Price" groupKey="price">
        <p className="text-sm muted">
          $0.00 – ${maxPrice.toFixed(2)}
        </p>
        <input
          type="range"
          className="range"
          min={0}
          max={priceCeiling}
          value={maxPrice}
          aria-label="Maximum price"
          onChange={(e) => onMaxPrice(Number(e.target.value))}
        />
      </FilterGroup>

      <FilterGroup title="Color" groupKey="color">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`swatch-row${activeColors.includes(color) ? " is-active" : ""}`}
            onClick={() => onToggleColor(color)}
          >
            <span className="swatch" data-color={color} aria-hidden />
            {color}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup title="Size" groupKey="size">
        {sizes.map((size) => (
          <label key={size} className="check">
            <input
              type="checkbox"
              checked={activeSizes.includes(size)}
              onChange={() => onToggleSize(size)}
            />
            {size}
          </label>
        ))}
      </FilterGroup>
    </aside>
  );
}

export function FilterDrawer({
  open,
  onClose,
  onClearAll,
  filtersProps,
}: {
  open: boolean;
  onClose: () => void;
  onClearAll: () => void;
  filtersProps: FiltersProps;
}) {
  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`filter-drawer${open ? " is-open" : ""}`}
      aria-modal="true"
      role="dialog"
      aria-label="Filters"
      aria-hidden={!open}
    >
      <div className="filter-drawer__backdrop" onClick={onClose} />
      <div className="filter-drawer__panel">
        <div className="filter-drawer__head">
          <span style={{ fontWeight: 600 }}>Filters</span>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={onClose}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>
        <div className="filter-drawer__body">
          <Filters {...filtersProps} showTitle={false} />
        </div>
        <div className="filter-drawer__foot">
          <button type="button" className="btn btn--outline btn--block" onClick={onClearAll}>
            Clear all
          </button>
          <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
