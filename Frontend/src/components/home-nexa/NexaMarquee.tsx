"use client";

import { useHomepageSection } from "@/lib/homepage-context";
import { repeaterItems } from "@/lib/homepage-helpers";

/** Infinite scrolling strip of style categories between hero and grid. */

const DEFAULT_ITEMS = [
  "Streetwear",
  "Classic Formal",
  "Everyday Essentials",
  "Sports & Active",
  "Modern Bottoms",
  "Premium Outerwear",
].map((text) => ({ text }));

function Track({ items, hidden = false }: { items: Record<string, string>[]; hidden?: boolean }) {
  return (
    <div className="nx-marquee-track" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={`${item.text}-${i}`} className="nx-marquee-item">
          {item.text}
          <span className="nx-marquee-star" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );
}

export function NexaMarquee() {
  const { content, visible } = useHomepageSection("sec_marquee");
  const items = repeaterItems(content, "items", DEFAULT_ITEMS);

  if (!visible) return null;

  return (
    <div className="nx-marquee" aria-label="Style categories">
      <Track items={items} />
      <Track items={items} hidden />
    </div>
  );
}
