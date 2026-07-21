"use client";

import Image from "next/image";
import Link from "next/link";
import { fashionSrc } from "@/lib/fashion-images";
import { FadeUp, Parallax } from "./motion";
import { useHomepageSection } from "@/lib/homepage-context";
import { fieldValue, repeaterItems } from "@/lib/homepage-helpers";

const DEFAULT_SHOTS = [
  { seed: "coat editorial street", title: "Outerwear Edit" },
  { seed: "suit tailoring editorial", title: "Sharp Tailoring" },
  { seed: "dress evening editorial", title: "Evening Lines" },
  { seed: "sweater knit texture", title: "Soft Knits" },
];

/** Editorial lookbook — asymmetric photo grid with hover labels. */
export function NexaLookbook() {
  const { content, visible } = useHomepageSection("sec_lookbook");
  const kicker = fieldValue(content, "kicker", "Lookbook");
  const heading = fieldValue(content, "heading", "The Season Lookbook");
  const shots = repeaterItems(content, "frames", DEFAULT_SHOTS);

  if (!visible) return null;

  return (
    <section className="nx-section">
      <div className="nx-container">
        <FadeUp>
          <div className="nx-section-head">
            <span className="nx-eyebrow">{kicker}</span>
            <h2 className="nx-h2">{heading}</h2>
            <p className="nx-sub">
              A closer look at this season&rsquo;s silhouettes — shot the way
              you&rsquo;ll actually wear them.
            </p>
          </div>
        </FadeUp>

        <div className="nx-lookbook">
          {shots.map((s, i) => {
            const big = i === 0;
            return (
              <FadeUp key={`${s.seed}-${i}`} delay={i * 0.08} className={big ? "nx-look is-big" : "nx-look"}>
                <Parallax range={24}>
                  <Link href="/shop" className="nx-look-card">
                    <Image
                      src={fashionSrc(s.seed, 760, big ? 940 : 460)}
                      alt={s.title}
                      width={760}
                      height={big ? 940 : 460}
                    />
                    <span className="nx-look-label">
                      {s.title}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M7 17 17 7M9 7h8v8" />
                      </svg>
                    </span>
                  </Link>
                </Parallax>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
