import { NextResponse } from "next/server";

/**
 * Storefront instant-search endpoint (Section 7).
 * GET /api/search?q=coat&limit=8
 * Returns matching products and the distinct categories among them.
 *
 * Proxies the real Express API's product search — this used to filter a
 * hardcoded demo array, completely disconnected from the actual catalog/
 * inventory, so results here never matched what /shop or the PDP pages
 * showed. `/shop/[slug]` treats its param as a raw product id (see
 * lib/api/products.ts getProduct), so `slug` below is just the product id,
 * and each category result carries its real id (not name) so the link
 * lands on a working `/shop?category=<id>` filter instead of a 400 from
 * the API rejecting a non-UUID categoryId.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface ApiProduct {
  id: string;
  name: string;
  basePrice: number;
  discountPrice: number | null;
  currency: string;
  category?: { id: string; name: string } | null;
  images: { slot: string; url: string }[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 8), 1), 24);

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  let apiProducts: ApiProduct[] = [];
  try {
    const res = await fetch(
      `${API_BASE}/products?search=${encodeURIComponent(q)}&limit=${limit}&isActive=true&sortBy=createdAt&sortOrder=desc`,
      { cache: "no-store" },
    );
    const body = await res.json();
    if (body?.success) apiProducts = body.data as ApiProduct[];
  } catch {
    return NextResponse.json({ products: [], categories: [] });
  }

  const formatPrice = (n: number, currency: string) =>
    `${currency === "NPR" ? "Rs." : currency} ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const products = apiProducts.map((p) => ({
    id: p.id,
    slug: p.id,
    name: p.name,
    category: p.category?.name ?? "",
    price: formatPrice(p.discountPrice ?? p.basePrice, p.currency),
    // Most seeded products have no uploaded image yet — null here, resolved
    // to a placeholder client-side via lib/fashion-images.ts resolveImage(),
    // same as every other product card in the app.
    thumb: p.images.find((img) => img.slot === "thumbnail")?.url ?? p.images[0]?.url ?? null,
  }));

  const seenCategories = new Map<string, string>();
  for (const p of apiProducts) {
    if (p.category && !seenCategories.has(p.category.id)) seenCategories.set(p.category.id, p.category.name);
  }
  const categories = Array.from(seenCategories, ([id, name]) => ({ id, name })).slice(0, 6);

  return NextResponse.json({ products, categories });
}
