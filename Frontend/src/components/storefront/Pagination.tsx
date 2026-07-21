"use client";

/**
 * Pagination system (Section 2).
 *
 * Two modes:
 *   A. <Pagination>      — classic numbered pagination with ellipsis window,
 *                          keyboard navigation, and smooth scroll-to-grid.
 *   B. <LoadMoreButton>  — single "Load more" button that appends the next page.
 *
 * Plus <PerPageSelect> and <ResultCount> helpers for the toolbar.
 *
 * URL state is owned by the parent page (read ?page= / ?per_page= and pass in);
 * these components are controlled and call back on change.
 */

import { useCallback } from "react";

/* ----------------------------------------------- page window (pure / testable) */

export type PageToken = number | "ellipsis-left" | "ellipsis-right";

/**
 * Build the page button list:
 *  - always first + last
 *  - 2 pages either side of current
 *  - ellipsis when the gap > 1
 * e.g. current=6 total=12 -> [1, …, 4,5,6,7,8, …, 12]
 */
export function getPageWindow(current: number, total: number): PageToken[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const tokens: PageToken[] = [];
  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);

  tokens.push(1);
  if (left > 2) tokens.push("ellipsis-left");
  for (let p = left; p <= right; p++) tokens.push(p);
  if (right < total - 1) tokens.push("ellipsis-right");
  tokens.push(total);

  return tokens;
}

/* ------------------------------------------------- smooth scroll to the grid */

export function scrollToGrid() {
  if (typeof document === "undefined") return;
  const grid = document.querySelector(".pgrid");
  if (!grid) return;
  const top = grid.getBoundingClientRect().top + window.scrollY - 80; // sticky header offset
  window.scrollTo({ top, behavior: "smooth" });
}

/* ============================================================= MODE A: numbered */

export function Pagination({
  page,
  totalPages,
  onPageChange,
  scrollOnChange = true,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  scrollOnChange?: boolean;
}) {
  const go = useCallback(
    (n: number) => {
      const next = Math.min(Math.max(1, n), totalPages);
      if (next === page) return;
      onPageChange(next);
      if (scrollOnChange) scrollToGrid();
    },
    [page, totalPages, onPageChange, scrollOnChange],
  );

  // Arrow keys move between pages when the nav has focus within.
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(page - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(page + 1);
    }
  };

  if (totalPages <= 1) return null;
  const tokens = getPageWindow(page, totalPages);

  return (
    <nav className="pagination" aria-label="Product pages" onKeyDown={onKeyDown}>
      <button
        type="button"
        className="page-btn"
        aria-label="Previous page"
        data-dir="prev"
        disabled={page === 1}
        onClick={() => go(page - 1)}
      >
        ←
      </button>

      {tokens.map((t) =>
        typeof t === "number" ? (
          <button
            key={t}
            type="button"
            className={`page-btn${t === page ? " is-active" : ""}`}
            aria-current={t === page ? "page" : undefined}
            onClick={() => go(t)}
          >
            {t}
          </button>
        ) : (
          <span key={t} className="page-btn pagination__ellipsis" aria-hidden>
            …
          </span>
        ),
      )}

      <button
        type="button"
        className="page-btn"
        aria-label="Next page"
        data-dir="next"
        disabled={page === totalPages}
        onClick={() => go(page + 1)}
      >
        →
      </button>
    </nav>
  );
}

/* ========================================================== MODE B: load more */

export function LoadMoreButton({
  hasNextPage,
  isLoadingMore,
  showing,
  total,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isLoadingMore: boolean;
  showing: number;
  total: number;
  onLoadMore: () => void;
}) {
  return (
    <div className="load-more-wrap">
      {hasNextPage && (
        <button
          type="button"
          className="btn btn--outline"
          onClick={onLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? "Loading…" : "Load more products"}
        </button>
      )}
      <p className="load-more-count">
        Showing {showing} of {total} products
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ toolbar helpers */

export function PerPageSelect({
  perPage,
  onChange,
  options = [12, 24, 48],
}: {
  perPage: number;
  onChange: (n: number) => void;
  options?: number[];
}) {
  return (
    <select
      className="select"
      style={{ width: "auto" }}
      value={perPage}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Products per page"
    >
      {options.map((n) => (
        <option key={n} value={n}>
          {n} per page
        </option>
      ))}
    </select>
  );
}

export function ResultCount({
  start,
  end,
  total,
}: {
  start: number;
  end: number;
  total: number;
}) {
  return (
    <span>
      Showing {start}–{end} of {total} results
    </span>
  );
}
