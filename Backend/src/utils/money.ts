/**
 * Money math helpers. All commerce calculations must go through these so
 * we get consistent rounding and never rely on floating-point noise.
 */

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

/** Apply a percentage (1..100) to a base amount. */
export const percentageOf = (base: number, percent: number): number =>
  round2((base * percent) / 100);

/** Apply a fixed discount, never letting the result go below zero. */
export const applyFixed = (base: number, discount: number): number =>
  round2(Math.max(0, base - Math.max(0, discount)));

/** Cap a discount so the resulting amount never goes below `floor`. */
export const capDiscount = (currentTotal: number, discount: number, floor = 0): number => {
  const raw = Math.max(0, discount);
  return round2(Math.max(0, Math.min(raw, currentTotal - floor)));
};

/**
 * The price a customer actually pays for a unit: the discounted price when a
 * valid one exists (positive and strictly lower than the original), otherwise
 * the original price. Single source of truth — cart, checkout, and product
 * DTOs must all price through this so the PDP price always equals the
 * checkout price.
 */
export const effectiveUnitPrice = (original: number, discounted?: number | null): number =>
  discounted != null && discounted > 0 && discounted < original ? round2(discounted) : round2(original);
