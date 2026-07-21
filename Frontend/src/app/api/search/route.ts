import { NextResponse } from "next/server";
import { PRODUCTS, formatPrice } from "@/lib/shop-data";
import { fashionSrc } from "@/lib/fashion-images";

/**
 * Storefront instant-search endpoint (Section 7).
 * GET /api/search?q=coat&limit=8
 * Returns matching products and the distinct categories among them.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 8), 1), 24);

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const matches = PRODUCTS.filter((p) => {
    const haystack = [p.name, p.category, p.audience, ...p.tags]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const products = matches.slice(0, limit).map((p) => ({
    id: p.id,
    slug: p.id,
    name: p.name,
    category: p.category,
    price: formatPrice(p.price),
    thumb: fashionSrc(p.id, 104, 128),
  }));

  const categories = Array.from(new Set(matches.map((p) => p.category))).slice(0, 6);

  return NextResponse.json({ products, categories });
}
