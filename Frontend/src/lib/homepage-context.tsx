"use client";

/**
 * HomepageProvider — fetches the CMS-editable homepage sections
 * (GET /homepage, public, visible-only) once and shares them with every
 * Nexa* section component via useHomepageSection(key).
 *
 * Mounted once in the (shop) layout so it covers every storefront page that
 * renders NexaHeader/NexaFooter (/, /shop, /shop/[slug], ...), not just the
 * homepage route itself.
 *
 * Each consuming component falls back to its own hardcoded default copy
 * while sections are loading or if a specific field/section is missing —
 * this hook never blocks first paint.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listPublicHomepageSections } from "@/lib/api/homepage";
import type { HomepageSectionDto } from "@/lib/api/types";

interface HomepageState {
  sections: HomepageSectionDto[];
  loading: boolean;
  /** Section (by storefront key, e.g. "sec_hero"), or null if missing/hidden/not loaded yet. */
  getSection: (key: string) => HomepageSectionDto | null;
}

const HomepageContext = createContext<HomepageState>({
  sections: [],
  loading: true,
  getSection: () => null,
});

export function HomepageProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<HomepageSectionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listPublicHomepageSections()
      .then((res) => {
        if (!cancelled) setSections(res.data);
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<HomepageState>(() => {
    const byKey = new Map(sections.map((s) => [s.key, s]));
    return {
      sections,
      loading,
      getSection: (key: string) => byKey.get(key) ?? null,
    };
  }, [sections, loading]);

  return <HomepageContext.Provider value={value}>{children}</HomepageContext.Provider>;
}

/**
 * Look up one section's live content by its storefront key.
 * Returns `{ content: null, visible: true, loading }` until the fetch
 * resolves or if the section isn't found — callers should render their
 * hardcoded default copy in that case, and only skip rendering when
 * `visible === false` is explicitly known.
 */
/**
 * Full list of live sections (unfiltered) — used by the homepage itself to
 * order/hide the section components per admin-configured sortOrder/visible.
 */
export function useHomepageSections() {
  const { sections, loading } = useContext(HomepageContext);
  return { sections, loading };
}

export function useHomepageSection(key: string) {
  const { getSection, loading } = useContext(HomepageContext);
  const section = getSection(key);
  return {
    content: section?.content ?? null,
    visible: section ? section.visible : true,
    loading,
  };
}
