"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductImage } from "./ProductImage";
import { AddToCartButton, WishlistButton } from "./Interactions";
import { discountPct, formatPrice, COLOR_SWATCHES } from "@/lib/shop-data";
import type { ShopProduct } from "@/lib/shop-data";

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span className="rating">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? "star" : ""} aria-hidden>
          {i < full ? "★" : "☆"}
        </span>
      ))}
      <span>{rating.toFixed(1)}</span>
    </span>
  );
}

export function ProductCard({ product }: { product: ShopProduct }) {
  const pct = discountPct(product);
  const save = product.compareAtPrice - product.price;
  const swatches = product.colors.slice(0, 5);

  return (
    <article className="pcard pcard--shop">
      <div className="pcard__media">
        <ProductImage
          seed={product.id}
          alt={product.name}
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 22vw"
          tone={product.tone}
          label={product.name}
        />

        <div className="pcard__badge">
          {pct > 0 && <span className="badge badge--discount">-{pct}%</span>}
          {product.reviews > 150 && <span className="badge badge--hot">Bestseller</span>}
        </div>

        <div className="pcard__actions">
          <WishlistButton id={product.id} name={product.name} />
          <Link
            href={`/shop/${product.id}`}
            className="icon-btn icon-btn--sm"
            aria-label={`Quick view ${product.name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
        </div>

        {/* slide-up shoppable footer */}
        <div className="pcard__quickadd">
          <AddToCartButton
            item={{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.id,
              color: product.colors[0],
              size: product.sizes[0],
            }}
            className="btn btn--primary btn--sm pcard__quickadd-btn"
            openDrawer={false}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Add to Cart
          </AddToCartButton>
        </div>
      </div>

      <div className="pcard__body">
        <div className="pcard__meta">
          <span className="text-xs muted">{product.category}</span>
          <Stars rating={product.rating} />
        </div>

        <Link href={`/shop/${product.id}`} className="pcard__name">
          {product.name}
        </Link>

        {swatches.length > 0 && (
          <div className="pcard__swatches" aria-label="Available colours">
            {swatches.map((c) => (
              <span
                key={c}
                className="pcard__swatch"
                title={c}
                style={{ background: COLOR_SWATCHES[c] ?? "#ccc" }}
              />
            ))}
            {product.colors.length > swatches.length && (
              <span className="pcard__swatch-more">+{product.colors.length - swatches.length}</span>
            )}
          </div>
        )}

        <div className="pcard__pricerow">
          <div className="price">
            <span className="price__now">{formatPrice(product.price)}</span>
            {product.compareAtPrice > product.price && (
              <span className="price__was">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>
          {save > 0 && <span className="pcard__save">Save {formatPrice(save)}</span>}
        </div>

        <p className="pcard__reviews text-xs muted">
          {product.inStock ? (
            <span className="pcard__stock">In stock</span>
          ) : (
            <span className="pcard__stock pcard__stock--low">Low stock</span>
          )}
          <span aria-hidden> · </span>
          {product.reviews.toLocaleString()} reviews
        </p>
      </div>
    </article>
  );
}

export function TopSellerTabs({ products }: { products: ShopProduct[] }) {
  const audiences = useMemo(() => {
    const set = Array.from(new Set(products.map((p) => p.audience).filter(Boolean)));
    return ["All", ...set];
  }, [products]);

  const [active, setActive] = useState("All");
  const visible = active === "All" ? products : products.filter((p) => p.audience === active);

  return (
    <div>
      <div className="tabs" aria-label="Filter by audience">
        {audiences.map((a) => (
          <button
            key={a}
            type="button"
            className={`tab${active === a ? " is-active" : ""}`}
            onClick={() => setActive(a)}
          >
            {a}
          </button>
        ))}
      </div>
      {/* keying on `active` restarts the staggered entrance on filter change */}
      <div className="pgrid pgrid--dense" key={active}>
        {visible.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
