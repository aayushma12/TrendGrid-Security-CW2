"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveImage } from "@/lib/fashion-images";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/shop-data";
import { cardPrice, defaultVariant, discountPct, productThumbnail } from "@/lib/product-helpers";
import type { ProductDto } from "@/lib/api/types";

/* Named colours → swatch hex, so cards show real fabric options. */
const SWATCH: Record<string, string> = {
  Brown: "#7B4B2A", "Light Brown": "#CBA77C", White: "#F4F1EA", Cream: "#E7DAC1",
  Black: "#20201E", Grey: "#B7B6B1", Green: "#4B6B3A", Red: "#B23A48",
  Blue: "#3A5A80", Pink: "#D79AAB", Orange: "#C98A3B", Gold: "#C9A24B",
};
const swatchOf = (name: string) => SWATCH[name] ?? "#C9A87C";

/** Shared premium product card (shop grid, home collections, related) — backed by a real ProductDto. */
export function NexaProductCard({ p }: { p: ProductDto }) {
  const { addToCart, showToast, openCart, isWishlisted, toggleWishlist } = useStore();
  const { price, compareAt } = cardPrice(p);
  const pct = discountPct(price, compareAt);
  const saved = isWishlisted(p.id);
  const variant = defaultVariant(p);
  const inStock = Boolean(variant && variant.stock > 0);
  const thumb = productThumbnail(p);
  const frontSrc = resolveImage(thumb, p.name, 640, 800);
  const colorNames = (p.colors ?? []).map((c) => c.name);

  return (
    <article className="nx-card nx-card-lux">
      <div className="nx-card-media">
        <Link href={`/shop/${p.id}`} className="nx-card-imgwrap" aria-label={p.name}>
          <Image
            className="nx-card-img is-front"
            src={frontSrc}
            alt={p.name}
            width={640}
            height={800}
          />
        </Link>

        {p.category?.name && <span className="nx-card-tag">{p.category.name}</span>}
        {pct > 0 && <span className="nx-card-sale">−{pct}%</span>}

        <button
          className={`nx-card-wish${saved ? " is-on" : ""}`}
          aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          aria-pressed={saved}
          onClick={() => {
            const added = toggleWishlist(p.id);
            showToast(added ? `${p.name} saved to wishlist` : `${p.name} removed`);
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7.5-4.6-10-9.2C.4 8.5 2 5 5.3 5c2 0 3.3 1.1 4.7 2.8C11.4 6.1 12.7 5 14.7 5 18 5 19.6 8.5 22 11.8 19.5 16.4 12 21 12 21Z" />
          </svg>
        </button>

        {!inStock && <span className="nx-card-oos">Sold Out</span>}

        {inStock && variant && (
          <div className="nx-card-quick">
            <button
              className="nx-card-add"
              onClick={async () => {
                const ok = await addToCart(variant.id, 1);
                if (ok) {
                  showToast(`${p.name} added to cart`);
                  openCart();
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 7h12l-1.2 12.2a1.6 1.6 0 0 1-1.6 1.4H8.8a1.6 1.6 0 0 1-1.6-1.4L6 7Z" />
                <path d="M9 7V6a3 3 0 0 1 6 0v1" />
              </svg>
              Add to Cart
            </button>
          </div>
        )}
      </div>

      <div className="nx-card-body">
        <div className="nx-card-head">
          <h3 className="nx-card-name">
            <Link href={`/shop/${p.id}`}>{p.name}</Link>
          </h3>
          <p className="nx-card-price">
            {formatPrice(price)}
            {compareAt !== null && <s>{formatPrice(compareAt)}</s>}
          </p>
        </div>

        {colorNames.length > 0 && (
          <div className="nx-card-foot">
            <span className="nx-card-swatches" aria-hidden>
              {colorNames.slice(0, 4).map((c, i) => (
                <span
                  key={`${c}-${i}`}
                  className="nx-swatch"
                  style={{ background: swatchOf(c) }}
                  title={c}
                />
              ))}
              {colorNames.length > 4 && (
                <span className="nx-swatch-more">+{colorNames.length - 4}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
