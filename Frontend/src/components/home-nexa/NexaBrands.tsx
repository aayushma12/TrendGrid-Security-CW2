"use client";

import { FadeUp } from "./motion";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue, repeaterItems } from "@/lib/homepage-helpers";

const DEFAULT_BRANDS = ["VOGUE", "GQ", "ESQUIRE", "HYPEBEAST", "COMPLEX", "HIGHSNOBIETY"].map(
  (name) => ({ name }),
);

/** "As featured in" press strip. */
export function NexaBrands() {
  const { content, visible } = useHomepageSection("sec_brands");
  const label = fieldValue(content, "label", "As featured in");
  const brands = repeaterItems(content, "brands", DEFAULT_BRANDS);

  if (!visible) return null;

  return (
    <section className="nx-brands">
      <div className="nx-container">
        <FadeUp>
          <p className="nx-brands-label">{label}</p>
          <div className="nx-brands-row">
            {brands.map((b, i) => (
              <span key={`${b.name}-${i}`} className="nx-brand">{b.name}</span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
