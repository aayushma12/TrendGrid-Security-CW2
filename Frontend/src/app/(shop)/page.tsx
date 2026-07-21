"use client";

import { NexaHeader } from "@/components/home-nexa/NexaHeader";
import { NexaHero } from "@/components/home-nexa/NexaHero";
import { NexaMarquee } from "@/components/home-nexa/NexaMarquee";
import { NexaCategories } from "@/components/home-nexa/NexaCategories";
import { NexaArrivals } from "@/components/home-nexa/NexaArrivals";
import { NexaAbout } from "@/components/home-nexa/NexaAbout";
import { NexaLookbook } from "@/components/home-nexa/NexaLookbook";
import { NexaBrands } from "@/components/home-nexa/NexaBrands";
import { NexaTestimonials } from "@/components/home-nexa/NexaTestimonials";
import { NexaCta } from "@/components/home-nexa/NexaCta";
import { NexaFaq } from "@/components/home-nexa/NexaFaq";
import { NexaFeatures } from "@/components/home-nexa/NexaFeatures";
import { NexaFooter } from "@/components/home-nexa/NexaFooter";
import { useHomepageSections } from "@/lib/homepage-context";

/**
 * Homepage — "Nexa" redesign (editorial light theme, lime accent).
 * Typography: Space Grotesk display + Manrope body (next/font, shop layout).
 * Motion: framer-motion — masked word-stagger hero, scroll parallax,
 * layout-animated category filters, count-up stats, marquee strip.
 * Styled by src/styles/home-nexa.css (all rules scoped under .nx).
 *
 * Section order and visibility for everything between the header and footer
 * are admin-configurable via the Homepage CMS (/admin/homepage). Each
 * component still renders its own hardcoded fallback copy while the CMS
 * content is loading or missing, so this page never blocks on the fetch —
 * it only reorders/hides based on whatever's already been resolved.
 */
const MAIN_SECTIONS: Array<{ key: string; Component: () => React.JSX.Element | null }> = [
  { key: "sec_hero", Component: NexaHero },
  { key: "sec_marquee", Component: NexaMarquee },
  { key: "sec_categories", Component: NexaCategories },
  { key: "sec_arrivals", Component: NexaArrivals },
  { key: "sec_about", Component: NexaAbout },
  { key: "sec_lookbook", Component: NexaLookbook },
  { key: "sec_brands", Component: NexaBrands },
  { key: "sec_testimonials", Component: NexaTestimonials },
  { key: "sec_cta", Component: NexaCta },
  { key: "sec_faq", Component: NexaFaq },
  { key: "sec_features", Component: NexaFeatures },
];

export default function HomePage() {
  const { sections } = useHomepageSections();
  const byKey = new Map(sections.map((s) => [s.key, s]));

  const ordered = [...MAIN_SECTIONS].sort((a, b) => {
    const oa = byKey.get(a.key)?.sortOrder ?? MAIN_SECTIONS.findIndex((m) => m.key === a.key);
    const ob = byKey.get(b.key)?.sortOrder ?? MAIN_SECTIONS.findIndex((m) => m.key === b.key);
    return oa - ob;
  });

  return (
    <div className="nx">
      <NexaHeader />
      <main>
        {ordered.map(({ key, Component }) => (
          <Component key={key} />
        ))}
      </main>
      <NexaFooter />
    </div>
  );
}
