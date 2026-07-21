"use client";

/**
 * Filter sidebar + mobile drawer.
 *
 * `Filters` is a controlled panel reused in both the desktop sidebar and the
 * mobile drawer. Each group is collapsible (chevron toggle) and its open/closed
 * state persists per group key in sessionStorage. `FilterDrawer` wraps the same
 * panel in a slide-in dialog for < 1024px.
 *
 * Category isn't a group here — the shop page already has category pills in
 * its sticky bar, so a second category control here would just be a
 * redundant, easy-to-desync duplicate of the same state.
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
  colors: string[];
  sizes: string[];
  genders: string[];
  activeColors: string[];
  activeSizes: string[];
  activeGenders: string[];
  minPrice: string;
  maxPrice: string;
  onSale: boolean;
  inStock: boolean;
  onToggleColor: (c: string) => void;
  onToggleSize: (s: string) => void;
  onToggleGender: (g: string) => void;
  onMinPrice: (v: string) => void;
  onMaxPrice: (v: string) => void;
  onToggleOnSale: () => void;
  onToggleInStock: () => void;
  showTitle?: boolean;
}

export function Filters({
  colors,
  sizes,
  genders,
  activeColors,
  activeSizes,
  activeGenders,
  minPrice,
  maxPrice,
  onSale,
  inStock,
  onToggleColor,
  onToggleSize,
  onToggleGender,
  onMinPrice,
  onMaxPrice,
  onToggleOnSale,
  onToggleInStock,
  showTitle = true,
}: FiltersProps) {
  return (
    <aside className="filters" aria-label="Filter options">
      {showTitle && <h2>Filter Options</h2>}

      <FilterGroup title="Price (NPR)" groupKey="price">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className="filter-price-input"
            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db" }}
            placeholder="Min"
            aria-label="Minimum price"
            value={minPrice}
            onChange={(e) => onMinPrice(e.target.value)}
          />
          <span aria-hidden>–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className="filter-price-input"
            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db" }}
            placeholder="Max"
            aria-label="Maximum price"
            value={maxPrice}
            onChange={(e) => onMaxPrice(e.target.value)}
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Gender" groupKey="gender">
        {genders.map((g) => (
          <label key={g} className="check">
            <input type="checkbox" checked={activeGenders.includes(g)} onChange={() => onToggleGender(g)} />
            {g}
          </label>
        ))}
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

      <FilterGroup title="Availability" groupKey="availability">
        <label className="check">
          <input type="checkbox" checked={onSale} onChange={onToggleOnSale} />
          On sale
        </label>
        <label className="check">
          <input type="checkbox" checked={inStock} onChange={onToggleInStock} />
          In stock only
        </label>
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
