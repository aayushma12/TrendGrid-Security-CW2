import { prisma } from "./db";
import { DEFAULT_THEME_TOKENS } from "./theme-defaults";
import type { ThemeTokens } from "./design-tokens";
import type { PatternConfig } from "@/components/storefront/PatternBackground";
import type { StoreProduct, CardBehaviour } from "@/components/storefront/primitives";
import type { SectionData } from "@/components/storefront/sections";

/**
 * Load the active theme's tokens for a tenant, falling back to defaults so the
 * storefront always renders even before any theme exists.
 */
export async function getActiveThemeTokens(tenantId: string): Promise<ThemeTokens> {
  const theme = await prisma.theme.findFirst({
    where: { tenantId, isActive: true, deletedAt: null },
  });
  if (!theme) return DEFAULT_THEME_TOKENS;
  // The Theme row is structurally a superset of ThemeTokens.
  return theme as unknown as ThemeTokens;
}

/** Build the section-render context (card behaviour + pattern) from tokens. */
export function buildSectionContext(
  tokens: ThemeTokens,
  products: StoreProduct[],
  currency: string,
) {
  const behaviour: CardBehaviour = {
    cardStyle: tokens.cardStyle,
    cardHoverEffect: tokens.cardHoverEffect,
    cardBadgeStyle: tokens.cardBadgeStyle,
    cardShowRating: tokens.cardShowRating,
    cardShowBadges: tokens.cardShowBadges,
    cardShowQuickBuy: tokens.cardShowQuickBuy,
    cardShowWishlist: tokens.cardShowWishlist,
  };
  const defaultPattern: PatternConfig = {
    patternType: tokens.patternType,
    patternColorA: tokens.patternColorA,
    patternColorB: tokens.patternColorB,
    patternColorC: tokens.patternColorC,
    patternOpacity: tokens.patternOpacity,
    patternSize: tokens.patternSize,
    patternAngle: tokens.patternAngle,
    patternBlur: tokens.patternBlur,
    patternSaturation: tokens.patternSaturation,
    overlayType: tokens.overlayType,
    overlayColor: tokens.overlayColor,
    overlayOpacity: tokens.overlayOpacity,
    overlayBlendMode: tokens.overlayBlendMode,
  };
  return {
    products,
    behaviour,
    currency,
    defaultPattern,
    entrance: tokens.animationEnabled ? tokens.animationEntrance : "none",
  };
}

/** Load published products for a tenant, shaped for the storefront. */
export async function getStoreProducts(
  tenantId: string,
  limit = 24,
): Promise<StoreProduct[]> {
  const products = await prisma.product.findMany({
    where: { tenantId, status: "active", deletedAt: null },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { where: { isDefault: true }, take: 1 },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return products.map((p: (typeof products)[number]): StoreProduct => {
    const variant = p.variants[0];
    const image = p.images[0];
    const price = variant?.price ? Number(variant.price) : null;
    const compareAtPrice = variant?.compareAtPrice ? Number(variant.compareAtPrice) : null;
    const onSale = price != null && compareAtPrice != null && compareAtPrice > price;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription,
      imageUrl: image?.url ?? null,
      price,
      compareAtPrice,
      rating: null,
      badge: onSale ? "Sale" : null,
      category: p.category?.name ?? null,
    };
  });
}

/** Load a page with its visible sections (ordered) for a tenant. */
export async function getPage(
  tenantId: string,
  slug: string,
): Promise<SectionData[]> {
  const page = await prisma.page.findFirst({
    where: { tenantId, slug, deletedAt: null },
    include: {
      sections: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        include: { blocks: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!page) return [];
  return page.sections.map((s: (typeof page.sections)[number]): SectionData => ({
    id: s.id,
    type: s.type,
    isVisible: s.isVisible,
    mobileHidden: s.mobileHidden,
    tabletHidden: s.tabletHidden,
    desktopHidden: s.desktopHidden,
    anchorId: s.anchorId,
    customClasses: s.customClasses,
    settingsJson: (s.settingsJson as Record<string, unknown>) ?? {},
    blocks: s.blocks.map((b: (typeof s.blocks)[number]) => ({
      id: b.id,
      type: b.type,
      contentJson: (b.contentJson as Record<string, unknown>) ?? {},
    })),
  }));
}
