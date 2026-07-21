/**
 * Small, shared helpers for rendering a real ProductDto across the storefront
 * (cards, listing, detail, search) — keeps pricing/variant/image logic in one
 * place instead of re-deriving it in every component.
 */
import type { ProductDto, ProductVariantDto } from "@/lib/api/types";

/** The variant a "quick add" button should use: first active + in-stock, else first variant, else none. */
export function defaultVariant(p: ProductDto): ProductVariantDto | undefined {
  const variants = p.variants ?? [];
  return variants.find((v) => v.isActive && v.stock > 0) ?? variants[0];
}

/** Card-level display price — product's own discountPrice/basePrice (not a specific variant). */
export function cardPrice(p: ProductDto): { price: number; compareAt: number | null } {
  const hasDiscount = p.discountPrice !== null && p.discountPrice < p.basePrice;
  return {
    price: hasDiscount ? (p.discountPrice as number) : p.basePrice,
    compareAt: hasDiscount ? p.basePrice : null,
  };
}

export function discountPct(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

/** Thumbnail slot first, else the first uploaded image, else null (caller should fall back to a placeholder). */
export function productThumbnail(p: ProductDto): string | null {
  return p.images.find((i) => i.slot === "thumbnail")?.url ?? p.images[0]?.url ?? null;
}

/** Unique, non-empty variant colors for a product (in first-seen order). */
export function variantColors(p: ProductDto): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of p.variants ?? []) {
    if (v.color && !seen.has(v.color)) {
      seen.add(v.color);
      out.push(v.color);
    }
  }
  return out;
}

/** Unique, non-empty variant sizes available for a given color (or all variants if color is omitted). */
export function variantSizes(p: ProductDto, color?: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of p.variants ?? []) {
    if (color && v.color !== color) continue;
    if (v.size && !seen.has(v.size)) {
      seen.add(v.size);
      out.push(v.size);
    }
  }
  return out;
}

/** Find the exact variant for a color+size combination. */
export function findVariant(p: ProductDto, color?: string, size?: string): ProductVariantDto | undefined {
  return (p.variants ?? []).find(
    (v) => (color ? v.color === color : true) && (size ? v.size === size : true),
  );
}
