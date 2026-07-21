import type { CSSProperties, ReactNode } from "react";

/** A product as surfaced to the storefront (subset of the DB model). */
export interface StoreProduct {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  rating?: number | null;
  badge?: string | null;
  category?: string | null;
}

/** Card behaviour flags resolved from the active theme. */
export interface CardBehaviour {
  cardStyle: string;
  cardHoverEffect: string;
  cardBadgeStyle: string;
  cardShowRating: boolean;
  cardShowBadges: boolean;
  cardShowQuickBuy: boolean;
  cardShowWishlist: boolean;
}

export function formatPrice(value?: number | null, currency = "NPR"): string {
  if (value == null) return "";
  if (currency === "NPR") {
    return `Rs. ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      value,
    );
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** Token-driven button. variant + hover effect both come from the theme. */
export function Button({
  children,
  variant = "primary",
  hover = "lift",
  href,
  className,
  style,
}: {
  children: ReactNode;
  variant?: string;
  hover?: string;
  href?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const cls = `ndh-btn ndh-btn--${variant} ${className ?? ""}`.trim();
  if (href) {
    return (
      <a className={cls} data-hover={hover} href={href} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} data-hover={hover} style={style} type="button">
      {children}
    </button>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span
      aria-label={`${rating} out of 5`}
      style={{ color: "var(--color-accent)", fontSize: "var(--font-size-sm)" }}
    >
      {"★".repeat(full)}
      <span style={{ color: "var(--color-border)" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}

/** Token-driven product card used by all product sections. */
export function ProductCard({
  product,
  behaviour,
}: {
  product: StoreProduct;
  behaviour: CardBehaviour;
}) {
  const onSale =
    product.compareAtPrice != null &&
    product.price != null &&
    product.compareAtPrice > product.price;

  return (
    <a
      href={`/product/${product.slug}`}
      className="ndh-card"
      data-style={behaviour.cardStyle}
      data-hover={behaviour.cardHoverEffect}
      style={{ display: "block", color: "inherit", textDecoration: "none" }}
    >
      <div style={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ndh-card__image"
          src={product.imageUrl ?? "https://placehold.co/600x600"}
          alt={product.title}
          loading="lazy"
        />
        {behaviour.cardShowBadges && (product.badge || onSale) && (
          <span
            className="ndh-badge"
            data-style={behaviour.cardBadgeStyle}
            style={{ position: "absolute", top: "0.75rem", left: "0.75rem" }}
          >
            {product.badge ?? "Sale"}
          </span>
        )}
      </div>
      <div style={{ paddingTop: "0.75rem" }}>
        <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)" }}>
          {product.title}
        </h3>
        {behaviour.cardShowRating && product.rating != null && (
          <div style={{ marginTop: "0.25rem" }}>
            <Stars rating={product.rating} />
          </div>
        )}
        <div
          style={{
            marginTop: "0.5rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "baseline",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span style={{ fontWeight: "var(--font-weight-bold)" }}>
            {formatPrice(product.price)}
          </span>
          {onSale && (
            <span
              className="ndh-muted"
              style={{ textDecoration: "line-through", fontSize: "var(--font-size-sm)" }}
            >
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        {behaviour.cardShowQuickBuy && (
          <div style={{ marginTop: "0.75rem" }}>
            <span className="ndh-btn ndh-btn--outline" data-hover="lift" style={{ width: "100%" }}>
              Quick add
            </span>
          </div>
        )}
      </div>
    </a>
  );
}

/** Standard section heading block. */
export function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title?: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  if (!title && !subtitle) return null;
  return (
    <div
      style={{
        textAlign: align,
        marginBottom: "2rem",
        maxWidth: align === "center" ? "640px" : undefined,
        marginInline: align === "center" ? "auto" : undefined,
      }}
    >
      {title && (
        <h2 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "var(--font-weight-bold)" }}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="ndh-muted" style={{ marginTop: "0.5rem", fontSize: "var(--font-size-lg)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
