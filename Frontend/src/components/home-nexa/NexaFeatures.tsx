"use client";

import { FadeUp } from "./motion";
import { STORE } from "@/lib/shop-data";
import { useHomepageSection } from "@/lib/homepage-context";
import { repeaterItems } from "@/lib/homepage-helpers";

const ICONS = [
  "M1 8h14v9H1z M15 11h4l3 3v3h-7v-6z M5.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M18.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  "M3 7v6h6 M21 17a9 9 0 0 0-15-6.7L3 13",
  "M12 2l8 4v6c0 5-3.4 7.7-8 10-4.6-2.3-8-5-8-10V6z M9 12l2 2 4-4",
  "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
];

const DEFAULT_FEATURES = [
  {
    title: "Free Shipping",
    text: `On every order over Rs. ${STORE.freeShippingOver.toLocaleString("en-IN")}, delivered fast.`,
  },
  {
    title: "Easy 30-Day Returns",
    text: "Changed your mind? Send it back free within 30 days.",
  },
  {
    title: "Secure Checkout",
    text: "Encrypted payments with cards, wallets, and COD.",
  },
  {
    title: "Human Support",
    text: `Real stylists on ${STORE.supportPhone}, Mon–Sat.`,
  },
];

/** Four-up benefits row. */
export function NexaFeatures() {
  const { content, visible } = useHomepageSection("sec_features");
  const features = repeaterItems(content, "items", DEFAULT_FEATURES);

  if (!visible) return null;

  return (
    <section className="nx-section" style={{ paddingTop: 0 }}>
      <div className="nx-container">
        <div className="nx-features">
          {features.map((f, i) => (
            <FadeUp key={`${f.title}-${i}`} delay={i * 0.07}>
              <div className="nx-feature">
                <span className="nx-info-icon" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICONS[i % ICONS.length]} />
                  </svg>
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
