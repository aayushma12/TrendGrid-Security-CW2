/**
 * Skeleton placeholders for the storefront (Section 1).
 *
 * `ProductGridSkeleton` mirrors the exact DOM of `.pcard` so the layout does
 * not shift when real products replace it. Each card's shimmer is staggered by
 * 80ms to create a loading "wave". `PageSkeleton` is the full-page variant used
 * on initial mount.
 */

/** A single skeleton card mirroring `.pcard` structure. */
export function ProductCardSkeleton({ index = 0 }: { index?: number }) {
  const delay = `${index * 80}ms`;
  return (
    <div className="pcard-skel" aria-hidden="true">
      <div className="pcard-skel__img" style={{ animationDelay: delay }} />
      <div className="pcard-skel__body">
        <div className="pcard-skel__line" style={{ animationDelay: delay }} />
        <div
          className="pcard-skel__line pcard-skel__line--short"
          style={{ animationDelay: delay }}
        />
        <div className="pcard-skel__price" style={{ animationDelay: delay }} />
      </div>
    </div>
  );
}

/** A grid of skeleton cards. Respects `--grid-columns` via `.pgrid`. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="pgrid pgrid--skel"
      role="status"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

/** Full-page skeleton: hero block + a 4-column grid of 8 cards. */
export function PageSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="page-skel section" role="status" aria-busy="true" aria-label="Loading page">
      <div className="container">
        <div className="page-skel__hero" />
        <div className="page-skel__grid">
          {Array.from({ length: count }, (_, i) => (
            <ProductCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductGridSkeleton;
