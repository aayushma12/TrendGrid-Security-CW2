"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { SHOP_THE_LOOK, getProduct, formatPrice } from "@/lib/shop-data";
import { fashionSrc } from "@/lib/fashion-images";

export function ShopTheLook() {
  const look = SHOP_THE_LOOK;
  const [active, setActive] = useState(look.hotspots[0].productId);
  const product = getProduct(active);

  const bundleTotal = look.hotspots.reduce((sum, h) => {
    const p = getProduct(h.productId);
    return sum + (p?.price ?? 0);
  }, 0);
  const bundleSave = (bundleTotal * look.bundleDiscount) / 100;

  return (
    <div className="lux-stl">
      <div className="lux-stl__stage">
        <Image
          src={fashionSrc(look.seed, 900, 1100)}
          alt={look.title}
          fill
          sizes="(max-width:900px) 100vw, 55vw"
          className="lux-stl__img"
        />
        {look.hotspots.map((h) => (
          <button
            key={h.productId}
            type="button"
            className={`lux-hotspot${active === h.productId ? " is-active" : ""}`}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            aria-label={`View ${h.label}`}
            onMouseEnter={() => setActive(h.productId)}
            onClick={() => setActive(h.productId)}
          >
            <span className="lux-hotspot__pulse" aria-hidden />
            <span className="lux-hotspot__plus" aria-hidden>+</span>
            <span className="lux-hotspot__tip">{h.label}</span>
          </button>
        ))}
      </div>

      <div className="lux-stl__panel">
        <p className="lux-kicker">{look.kicker}</p>
        <h2 className="lux-h2">{look.title}</h2>
        <p className="lux-stl__lead">Tap a marker to explore each piece, or take the whole look.</p>

        {product && (
          <div className="lux-stl__product">
            <div className="lux-stl__thumb">
              <Image
                src={fashionSrc(product.id, 200, 240)}
                alt={product.name}
                fill
                sizes="92px"
                className="lux-stl__thumbImg"
              />
            </div>
            <div className="lux-stl__info">
              <span className="lux-stl__cat">{product.category}</span>
              <strong className="lux-stl__name">{product.name}</strong>
              <span className="lux-stl__price">
                {formatPrice(product.price)}
                <s>{formatPrice(product.compareAtPrice)}</s>
              </span>
            </div>
            <Link href={`/shop/${product.id}`} className="btn btn--outline btn--sm">View</Link>
          </div>
        )}

        <div className="lux-stl__chips">
          {look.hotspots.map((h) => {
            const p = getProduct(h.productId);
            return (
              <button
                key={h.productId}
                type="button"
                className={`lux-chip${active === h.productId ? " is-active" : ""}`}
                onClick={() => setActive(h.productId)}
              >
                {p?.name ?? h.label}
              </button>
            );
          })}
        </div>

        <div className="lux-stl__bundle">
          <div>
            <span className="lux-stl__bundleLabel">Buy the complete look</span>
            <span className="lux-stl__bundleSave">Save {look.bundleDiscount}% · {formatPrice(bundleSave)} off</span>
          </div>
          <Link href="/shop" className="btn btn--primary">Add Look · {formatPrice(bundleTotal - bundleSave)}</Link>
        </div>
      </div>
    </div>
  );
}
