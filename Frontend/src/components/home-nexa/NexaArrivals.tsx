"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listProducts } from "@/lib/api/products";
import { NexaProductCard } from "./NexaProductCard";
import { FadeUp } from "./motion";
import type { ProductDto } from "@/lib/api/types";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue } from "@/lib/homepage-helpers";

/** Horizontal snap-scroll rail of new arrivals — real products flagged isNewArrival. */
export function NexaArrivals() {
  const [picks, setPicks] = useState<ProductDto[]>([]);
  const { content, visible } = useHomepageSection("sec_arrivals");
  const heading = fieldValue(content, "heading", "New Arrivals");
  const subtext = fieldValue(content, "subtext", "Fresh drops — scroll sideways to browse.");

  useEffect(() => {
    void listProducts({ isNewArrival: true, isActive: true, limit: 8 })
      .then((res) => {
        // Fall back to featured picks if nothing is flagged as a new arrival yet.
        if (res.data.length > 0) {
          setPicks(res.data);
        } else {
          void listProducts({ isFeatured: true, isActive: true, limit: 8 })
            .then((r2) => setPicks(r2.data))
            .catch(() => setPicks([]));
        }
      })
      .catch(() => setPicks([]));
  }, []);

  if (!visible || picks.length === 0) return null;

  return (
    <section className="nx-section" style={{ paddingTop: 0 }}>
      <div className="nx-container">
        <FadeUp>
          <div className="nx-page-head" style={{ marginBottom: 24 }}>
            <div>
              <h2 className="nx-h2" style={{ margin: 0 }}>{heading}</h2>
              <p className="nx-result-note" style={{ marginTop: 6 }}>
                {subtext}
              </p>
            </div>
            <Link href="/shop" className="nx-btn nx-btn-ghost">
              View All
            </Link>
          </div>
        </FadeUp>
      </div>
      <div className="nx-rail-wrap">
        <div className="nx-container">
          <div className="nx-rail">
            {picks.map((p) => (
              <div className="nx-rail-item" key={p.id}>
                <NexaProductCard p={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
