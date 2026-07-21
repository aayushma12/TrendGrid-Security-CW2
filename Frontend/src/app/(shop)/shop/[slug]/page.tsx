"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { NexaProductCard } from "@/components/home-nexa/NexaProductCard";
import { FadeUp } from "@/components/home-nexa/motion";
import { resolveImage } from "@/lib/fashion-images";
import { useStore } from "@/lib/store-context";
import { useAuth, formatAuthError } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";
import { getProduct, listProducts } from "@/lib/api/products";
import { createReview, getReviewSummary, listReviews } from "@/lib/api/reviews";
import { cardPrice, discountPct, findVariant, productThumbnail, variantColors, variantSizes } from "@/lib/product-helpers";
import { formatPrice } from "@/lib/shop-data";
import type { ProductDto, ReviewDto, ReviewSummaryDto } from "@/lib/api/types";

const TABS = ["Story", "Materials & Care", "Size Guide", "Reviews"] as const;
type Tab = (typeof TABS)[number];

const STATIC_TAB_COPY: Record<Exclude<Tab, "Reviews">, string> = {
  Story:
    "Designed in-house and cut from responsibly sourced fabric, this piece balances a clean modern silhouette with everyday comfort. Wear it dressed up or down — it is built to become a signature staple in your rotation.",
  "Materials & Care":
    "Premium mid-weight fabric with a soft hand feel and structured drape. Machine wash cold on gentle, hang dry, and iron on low if needed. Avoid bleach and tumble drying to keep the fit and finish sharp.",
  "Size Guide":
    "True to size with a tailored-but-relaxed cut. If you are between sizes, size up for a looser layered look or stay with your usual size for a closer fit.",
};

const SWATCH: Record<string, string> = {
  Black: "#1f1c20", White: "#f4f1ea", Grey: "#b9b8b4", Brown: "#7b4b2a",
  Cream: "#e8dcc2", Green: "#4c6444", Red: "#a53d34", Blue: "#3c5a78",
  Pink: "#d98ba0", Orange: "#c98a3b", Gold: "#c9a24b", "Light Brown": "#c9a87c",
};

/** /shop/[slug] — Nexa-themed product detail. `slug` is the real product id. */
export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { addToCart, showToast, openCart, isWishlisted, toggleWishlist } = useStore();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [related, setRelated] = useState<ProductDto[]>([]);

  const [color, setColor] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("Story");
  const [imgIndex, setImgIndex] = useState(0);

  const [summary, setSummary] = useState<ReviewSummaryDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFoundFlag(false);
    getProduct(slug)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.data);
        const colors = variantColors(res.data);
        const sizes = variantSizes(res.data);
        setColor(colors[0]);
        setSize(sizes[0]);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.statusCode === 404) setNotFoundFlag(true);
        setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!product?.category?.id) {
      setRelated([]);
      return;
    }
    void listProducts({ categoryId: product.category.id, isActive: true, limit: 5 })
      .then((res) => setRelated(res.data.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => setRelated([]));
  }, [product]);

  const loadReviews = useCallback(async () => {
    if (!product) return;
    setReviewsLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        getReviewSummary(product.id),
        listReviews({ productId: product.id, status: "APPROVED", limit: 10, sortBy: "createdAt", sortOrder: "desc" }),
      ]);
      setSummary(summaryRes.data);
      setReviews(listRes.data);
    } catch {
      setSummary(null);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [product]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  if (notFoundFlag) notFound();

  if (loading || !product) {
    return (
      <div className="nx">
        <NexaHeader />
        <main className="nx-page">
          <div className="nx-container">
            <p style={{ padding: "60px 0", color: "var(--nx-muted, #6b7280)" }}>Loading…</p>
          </div>
        </main>
        <NexaFooter />
      </div>
    );
  }

  const colors = variantColors(product);
  const sizes = variantSizes(product, color);
  const variant = findVariant(product, color, size);
  const { price: cardPriceValue, compareAt } = cardPrice(product);
  const price = variant ? variant.discountPrice ?? variant.price : cardPriceValue;
  const pct = discountPct(price, variant ? (variant.discountPrice ? variant.price : null) : compareAt);
  const wished = isWishlisted(product.id);

  const thumb = productThumbnail(product);
  const images = product.images.length > 0
    ? product.images.map((i) => i.url)
    : [resolveImage(thumb, product.name, 880, 1100)];
  const activeImg = images[Math.min(imgIndex, images.length - 1)];

  const inStock = variant ? variant.stock > 0 : false;
  const canAdd = Boolean(variant) && inStock;

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !product) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await createReview({
        productId: product.id,
        userId: user.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim() || undefined,
      });
      setReviewTitle("");
      setReviewComment("");
      setReviewRating(5);
      showToast("Thanks — your review was submitted!");
      void loadReviews();
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : formatAuthError(err));
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="nx">
      <NexaHeader />
      <main className="nx-page">
        <div className="nx-container">
          <nav className="nx-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/shop">Shop</Link>
            <span aria-hidden>/</span>
            <span>{product.name}</span>
          </nav>

          <div className="nx-detail">
            <div className="nx-detail-photo">
              <div className="nx-hero2-photo">
                <Image src={activeImg} alt={product.name} width={880} height={1100} priority />
              </div>
              {images.length > 1 && (
                <div className="nx-detail-thumbs">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      className={imgIndex === i ? "is-active" : ""}
                      onClick={() => setImgIndex(i)}
                      aria-label="View photo"
                    >
                      <Image src={src} alt="" width={74} height={88} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="nx-detail-info">
              {product.category?.name && <span className="nx-card-tag">{product.category.name}</span>}
              <h1 className="nx-detail-title">{product.name}</h1>
              {summary && summary.totalReviews > 0 && (
                <span className="nx-rating">
                  <span className="nx-stars" aria-hidden>
                    {"★".repeat(Math.round(summary.averageRating))}
                    {"☆".repeat(5 - Math.round(summary.averageRating))}
                  </span>
                  {summary.averageRating.toFixed(1)} · {summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}
                </span>
              )}

              <div className="nx-price-row">
                <span className="nx-price">{formatPrice(price)}</span>
                {pct > 0 && variant?.discountPrice && (
                  <>
                    <span className="nx-price-was">{formatPrice(variant.price)}</span>
                    <span className="nx-save-chip">Save {pct}%</span>
                  </>
                )}
                {pct > 0 && !variant?.discountPrice && compareAt !== null && (
                  <>
                    <span className="nx-price-was">{formatPrice(compareAt)}</span>
                    <span className="nx-save-chip">Save {pct}%</span>
                  </>
                )}
              </div>

              {product.shortDescription && <p className="nx-detail-desc">{product.shortDescription}</p>}
              {variant?.sku && (
                <p className="nx-detail-desc" style={{ marginTop: -6 }}>SKU {variant.sku}</p>
              )}

              {colors.length > 0 && (
                <>
                  <span className="nx-opt-label">
                    Color — <b>{color}</b>
                  </span>
                  <div className="nx-swatches">
                    {colors.map((c) => (
                      <button
                        key={c}
                        className={`nx-swatch${color === c ? " is-active" : ""}`}
                        style={{ background: SWATCH[c] ?? "#ccc" }}
                        onClick={() => {
                          setColor(c);
                          const nextSizes = variantSizes(product, c);
                          if (!nextSizes.includes(size ?? "")) setSize(nextSizes[0]);
                        }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {sizes.length > 0 && (
                <>
                  <span className="nx-opt-label">
                    Size — <b>{size}</b>
                  </span>
                  <div className="nx-sizes">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        className={`nx-size-btn${size === s ? " is-active" : ""}`}
                        onClick={() => setSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="nx-buy-row">
                <div className="nx-qty" aria-label="Quantity">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(9, q + 1))} aria-label="Increase">+</button>
                </div>
                <button
                  className="nx-btn nx-btn-accent"
                  disabled={!canAdd}
                  title={!variant ? "Select a color/size" : !inStock ? "Out of stock" : undefined}
                  onClick={async () => {
                    if (!variant) return;
                    const ok = await addToCart(variant.id, qty);
                    if (ok) {
                      showToast(`${product.name} added to cart`);
                      openCart();
                    }
                  }}
                >
                  {!variant ? "Select options" : !inStock ? "Out of Stock" : "Add to Cart"}
                  <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
                <button
                  className="nx-btn nx-btn-ghost"
                  onClick={() => {
                    const added = toggleWishlist(product.id);
                    showToast(added ? "Added to wishlist" : "Removed from wishlist");
                  }}
                >
                  {wished ? "♥ Wishlisted" : "♡ Wishlist"}
                </button>
              </div>

              <div className="nx-trust-row">
                <span>🚚 Free shipping over {formatPrice(180)}</span>
                <span>↩ 30-day free returns</span>
                <span>✓ Quality guaranteed</span>
              </div>

              <div className="nx-dtabs" role="tablist" aria-label="Product information">
                {TABS.map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    className={`nx-pill${tab === t ? " is-active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t === "Reviews" && summary ? `Reviews (${summary.totalReviews})` : t}
                  </button>
                ))}
              </div>
              <div className="nx-dtab-panel" role="tabpanel">
                {tab !== "Reviews" ? (
                  STATIC_TAB_COPY[tab]
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {reviewsLoading ? (
                      <p>Loading reviews…</p>
                    ) : reviews.length === 0 ? (
                      <p>No reviews yet — be the first to share your thoughts.</p>
                    ) : (
                      reviews.map((r) => (
                        <div key={r.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                            <span aria-hidden>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                            <span style={{ color: "var(--nx-muted, #6b7280)" }}>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {r.title && <p style={{ fontWeight: 700, margin: "6px 0 2px" }}>{r.title}</p>}
                          {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
                          {r.adminReply && (
                            <p style={{ marginTop: 8, fontSize: 13, background: "#f7f7f5", padding: 10, borderRadius: 8 }}>
                              <b>Store reply:</b> {r.adminReply}
                            </p>
                          )}
                        </div>
                      ))
                    )}

                    {isAuthenticated ? (
                      <form onSubmit={submitReview} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                        <h4 style={{ margin: 0 }}>Write a review</h4>
                        <div className="nx-field">
                          <label htmlFor="rv-rating">Rating</label>
                          <select
                            id="rv-rating"
                            className="nx-input"
                            value={reviewRating}
                            onChange={(e) => setReviewRating(Number(e.target.value))}
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
                            ))}
                          </select>
                        </div>
                        <div className="nx-field">
                          <label htmlFor="rv-title">Title</label>
                          <input
                            id="rv-title" className="nx-input" value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)} placeholder="Optional"
                          />
                        </div>
                        <div className="nx-field">
                          <label htmlFor="rv-comment">Comment</label>
                          <textarea
                            id="rv-comment" className="nx-input" rows={3} value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)} placeholder="Optional"
                          />
                        </div>
                        {reviewError && <p style={{ color: "#b91c1c", fontSize: 13 }}>{reviewError}</p>}
                        <button type="submit" className="nx-btn nx-btn-dark" disabled={submittingReview} style={{ alignSelf: "flex-start" }}>
                          {submittingReview ? "Submitting…" : "Submit review"}
                        </button>
                        <p style={{ fontSize: 12, color: "var(--nx-muted, #6b7280)" }}>
                          Reviews can only be submitted for products from a delivered order.
                        </p>
                      </form>
                    ) : (
                      <p style={{ fontSize: 13 }}>
                        <Link href={`/login?redirect=/shop/${product.id}`}>Sign in</Link> to write a review.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className="nx-related">
              <FadeUp>
                <div className="nx-section-head">
                  <h2 className="nx-h2">You May Also Like</h2>
                </div>
              </FadeUp>
              <div className="nx-grid-4">
                {related.map((p, i) => (
                  <FadeUp key={p.id} delay={i * 0.06}>
                    <NexaProductCard p={p} />
                  </FadeUp>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <NexaFooter />
    </div>
  );
}
