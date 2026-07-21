"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE, FadeUp } from "./motion";
import { NexaProductCard } from "./NexaProductCard";
import { listProducts } from "@/lib/api/products";
import { listActiveCollections, listCollectionProducts } from "@/lib/api/collections";
import type { CollectionDto } from "@/lib/api/collections";
import type { ProductDto } from "@/lib/api/types";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue } from "@/lib/homepage-helpers";

/** Category filter + shoppable product grid with layout-animated switches.
 *  Tabs are the real, admin-curated Collections (Men, Summer Collection, ...)
 *  — not static labels — so what shoppers see always matches what the admin
 *  has actually configured. */
export function NexaCategories() {
  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [active, setActive] = useState<string | "all">("all");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const { content, visible } = useHomepageSection("sec_categories");
  const heading = fieldValue(content, "heading", "Shape Your Signature Style");
  const subtext = fieldValue(
    content,
    "subtext",
    "Browse fashion categories and explore outfits that match your personality, suit every moment, and upgrade your everyday look.",
  );

  useEffect(() => {
    void listActiveCollections()
      .then((res) => setCollections(res.data.slice(0, 5)))
      .catch(() => setCollections([]));
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      if (active === "all") {
        const res = await listProducts({ isActive: true, limit: 4 });
        setProducts(res.data);
      } else {
        const res = await listCollectionProducts(active, { limit: 4 });
        setProducts(res.data.products);
      }
    } catch {
      setProducts([]);
    }
  }, [active]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

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
          <div className="nx-pills" role="tablist" aria-label="Product collections">
            <button
              role="tab"
              aria-selected={active === "all"}
              className={`nx-pill${active === "all" ? " is-active" : ""}`}
              onClick={() => setActive("all")}
            >
              {active === "all" && (
                <motion.span className="nx-pill-bg" layoutId="nx-pill-bg" transition={{ type: "spring", stiffness: 420, damping: 34 }} aria-hidden />
              )}
              <span className="nx-pill-label">All Styles</span>
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={active === c.id}
                className={`nx-pill${active === c.id ? " is-active" : ""}`}
                onClick={() => setActive(c.id)}
              >
                {active === c.id && (
                  <motion.span className="nx-pill-bg" layoutId="nx-pill-bg" transition={{ type: "spring", stiffness: 420, damping: 34 }} aria-hidden />
                )}
                <span className="nx-pill-label">{c.name}</span>
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
            <Link href={active === "all" ? "/shop" : `/collections/${active}`} className="nx-btn nx-btn-ghost">
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
