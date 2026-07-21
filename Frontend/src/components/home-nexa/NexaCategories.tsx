"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Category } from "@/lib/shop-data";
import { EASE, FadeUp } from "./motion";
import { NexaProductCard } from "./NexaProductCard";
import { listProducts } from "@/lib/api/products";
import type { ProductDto } from "@/lib/api/types";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue } from "@/lib/homepage-helpers";

const TABS: Array<{ label: string; category: Category | "All" }> = [
  { label: "All Styles", category: "All" },
  { label: "Coats", category: "Coats" },
  { label: "Dresses", category: "Dresses" },
  { label: "Shirts", category: "Shirt" },
  { label: "Sweaters", category: "Sweater" },
  { label: "Accessories", category: "Accessories" },
];

/** Category filter + shoppable product grid with layout-animated switches. */
export function NexaCategories() {
  const [active, setActive] = useState<Category | "All">("All");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const { content, visible } = useHomepageSection("sec_categories");
  const heading = fieldValue(content, "heading", "Shape Your Signature Style");
  const subtext = fieldValue(
    content,
    "subtext",
    "Browse fashion categories and explore outfits that match your personality, suit every moment, and upgrade your everyday look.",
  );

  // Note: the tab labels below are static (not backed by real category ids),
  // so this section shows active products and doesn't filter by tab yet.
  useEffect(() => {
    void listProducts({ isActive: true, limit: 4 })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
  }, [active]);

  if (!visible) return null;

  return (
    <section className="nx-section" id="collections">
      <div className="nx-container">
        <FadeUp>
          <div className="nx-section-head">
            <span className="nx-eyebrow nx-cat-eyebrow">Curated Collections</span>
            <h2 className="nx-h2">{heading}</h2>
            <p className="nx-sub">{subtext}</p>
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <div className="nx-pills" role="tablist" aria-label="Product categories">
            {TABS.map((t) => (
              <button
                key={t.label}
                role="tab"
                aria-selected={active === t.category}
                className={`nx-pill${active === t.category ? " is-active" : ""}`}
                onClick={() => setActive(t.category)}
              >
                {active === t.category && (
                  <motion.span
                    className="nx-pill-bg"
                    layoutId="nx-pill-bg"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden
                  />
                )}
                <span className="nx-pill-label">{t.label}</span>
              </button>
            ))}
          </div>
        </FadeUp>

        <motion.div className="nx-grid-4" layout>
          <AnimatePresence mode="popLayout" initial={false}>
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: EASE }}
              >
                <NexaProductCard p={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <FadeUp delay={0.1}>
          <div className="nx-cat-more">
            <Link href="/shop" className="nx-btn nx-btn-ghost">
              View All Products
              <svg className="nx-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
