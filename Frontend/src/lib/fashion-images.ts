/* ============================================================================
   NDH TrendGrid — FASHION IMAGE RESOLVER
   ----------------------------------------------------------------------------
   The storefront previously pulled imagery from picsum.photos, which returns
   *random* photos (landscapes, objects, etc.) — so nothing on the page looked
   like a clothing store. This module maps every image "seed" (product id or a
   descriptive section seed) to a real fashion/clothing photo on Unsplash,
   chosen deterministically by garment keyword so SSR and client render match.

   images.unsplash.com is already allow-listed in next.config.ts. If any photo
   id is ever retired, the <SmartImage> fallback renders a premium fabric-toned
   tile instead — so the page always reads as a cohesive boutique.
   ========================================================================== */

type Pool = { ids: string[]; crop: string };

/* Curated Unsplash photo ids grouped by garment / context. */
const POOLS: Record<string, Pool> = {
  women: {
    crop: "faces,center",
    ids: [
      "1539109136881-3be0616acf4b",
      "1485968579580-b6d095142e6e",
      "1469334031218-e382a71b716b",
      "1483985988355-763728e1935b",
      "1487222477894-8943e31ef7b2",
    ],
  },
  men: {
    crop: "faces,center",
    ids: [
      "1521572163474-6864f9cf17ab",
      "1488161628813-04466f872be2",
      "1507003211169-0a1dd7228f2d",
      "1490578474895-699cd4e2cf59",
      "1503341504253-dff4815485f1",
    ],
  },
  dress: {
    crop: "faces,center",
    ids: [
      "1595777457583-95e059d581b8",
      "1566174053879-31528523f8ae",
      "1572804013427-4d7ca7268217",
      "1496747611176-843222e1e57c",
      "1539008835657-9e8e9680c956",
    ],
  },
  coat: {
    crop: "faces,center",
    ids: [
      "1539533018447-63fcce2678e3",
      "1591047139829-d91aecb6caea",
      "1544022613-e87ca75a784a",
      "1551028719-00167b16eac5",
      "1525450824786-227cbef70703",
    ],
  },
  suit: {
    crop: "faces,center",
    ids: [
      "1594938298603-c8148c4dae35",
      "1507679799987-c73779587ccf",
      "1593032465175-481ac7f401a0",
      "1521119989659-a83eee488004",
      "1617137968427-85924c800a22",
    ],
  },
  knit: {
    crop: "center",
    ids: [
      "1576566588028-4147f3842f27",
      "1434389677669-e08b4cac3105",
      "1556905055-8f358a7a47b2",
      "1620799140408-edc6dcb6d633",
      "1620012253295-c15cc3e65df4",
    ],
  },
  shirt: {
    crop: "center",
    ids: [
      "1564584217132-2271feaeb3c5",
      "1602810318383-e386cc2a3ccf",
      "1598033129183-c4f50c736f10",
      "1626497764746-6dc36546b388",
      "1603252109303-2751441dd157",
    ],
  },
  accessories: {
    crop: "entropy",
    ids: [
      "1584917865442-de89df76afd3",
      "1548036328-c9fa89d128fa",
      "1591561954557-26941169b49e",
      "1591348122449-02525d70379b",
      "1559563458-527698bf5295",
    ],
  },
  watch: {
    crop: "entropy",
    ids: [
      "1523275335684-37898b6baf30",
      "1547996160-81dfa63595aa",
      "1524805444758-089113d48a6d",
      "1612817159949-195b6eb9e31a",
      "1434056886845-dac89ffe9b56",
    ],
  },
  editorial: {
    crop: "faces,center",
    ids: [
      "1490481651871-ab68de25d43d",
      "1492707892479-7bc8d5a4ee93",
      "1441984904996-e0b6ba687e04",
      "1469334031218-e382a71b716b",
      "1483985988355-763728e1935b",
      "1525507119028-ed4c629a60a3",
    ],
  },
  ugc: {
    crop: "faces,center",
    ids: [
      "1524504388940-b1c1722653e1",
      "1500648767791-00dcc994a43e",
      "1517841905240-472988babdf9",
      "1506794778202-cad84cf45f1d",
      "1539571696357-5a69c17a67c6",
      "1534528741775-53994a69daeb",
    ],
  },
  flatlay: {
    crop: "entropy",
    ids: [
      "1445205170230-053b83016050",
      "1558769132-cb1aea458c5e",
      "1567401893414-76b7b1e5a7a5",
      "1490114538077-0a7f8cb49891",
      "1556905055-8f358a7a47b2",
    ],
  },
  general: {
    crop: "faces,center",
    ids: [
      "1490481651871-ab68de25d43d",
      "1539109136881-3be0616acf4b",
      "1521572163474-6864f9cf17ab",
      "1485968579580-b6d095142e6e",
      "1483985988355-763728e1935b",
      "1469334031218-e382a71b716b",
    ],
  },
};

/* Keyword → pool, most specific first. */
const ROUTES: [RegExp, keyof typeof POOLS][] = [
  [/watch/, "watch"],
  [/bag|handbag|purse|accessor|sunglass|jewel|belt|scarf|hat/, "accessories"],
  [/coat|jacket|outerwear|winter|parka|camel/, "coat"],
  [/suit|blazer|tailor|tuxedo|ivory/, "suit"],
  [/dress|gown|evening|party|stylist/, "dress"],
  [/sweter|sweater|knit|jumper|cardigan|wool/, "knit"],
  [/shirt|blouse|tee|t-shirt|top/, "shirt"],
  [/ugc|customer|review|social|community/, "ugc"],
  [/flatlay|rack|folded|wardrobe/, "flatlay"],
  [/men|man\b/, "men"],
  [/women|woman|she|her/, "women"],
  [/hero|editorial|lookbook|outfit|model|banner|sale|collection|detail|trend|guide|tips|chapter/, "editorial"],
];

/** Tiny deterministic string hash (FNV-1a). */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function poolFor(seed: string): Pool {
  const s = seed.toLowerCase();
  for (const [re, key] of ROUTES) {
    if (re.test(s)) return POOLS[key];
  }
  return POOLS.general;
}

/**
 * Resolve a seed to a real Unsplash clothing photo at the requested size.
 * Deterministic: the same seed always yields the same photo.
 */
export function fashionSrc(seed: string, w: number, h: number): string {
  const pool = poolFor(seed);
  const id = pool.ids[hash(seed) % pool.ids.length];
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=${pool.crop}&auto=format&q=72`;
}

/* Neutral, on-brand fabric tones for the graceful fallback tile. */
const TONES = ["#C9A87C", "#A9863A", "#7B4B2A", "#D9C7A7", "#6E3B2C", "#9A6A3F", "#BDBCB8", "#2A2326"];

/** Deterministic fallback tone for a seed when no explicit product tone exists. */
export function toneFor(seed: string): string {
  return TONES[hash(seed) % TONES.length];
}

/**
 * Resolve a real uploaded image URL when present, otherwise fall back to a
 * deterministic Unsplash placeholder keyed by `seed` (product name/id).
 * Used everywhere a ProductDto/CartItemDto image needs to render — most
 * demo/seeded products have no uploaded Cloudinary image yet.
 */
export function resolveImage(url: string | null | undefined, seed: string, w: number, h: number): string {
  return url && url.trim() ? url : fashionSrc(seed, w, h);
}
