import { prisma } from "@/lib/db";
import { resolveTenant, tenantNotFound } from "@/lib/tenant";
import { sanitizeTokens } from "@/lib/theme-write";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme-defaults";

const IMG = {
  hero: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  women: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=80",
  men: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80",
  accessories: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80",
  promo: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80",
};

/** Default content for the clothing home page — every field stays editable in
 *  the Page Builder afterwards (texts, images, links, lists). */
const TEMPLATE_SECTIONS: { type: string; settingsJson: Record<string, unknown> }[] = [
  {
    type: "fashion_hero",
    settingsJson: {
      badge: "50% OFF Summer Super Sale",
      heading: "Step into Style: Your Ultimate Fashion Destination",
      subtext:
        "Discover curated collections for every season — premium fabrics, timeless cuts, and pieces designed to be loved for years.",
      ctaText: "Shop Now",
      ctaLink: "?page=shop",
      image: IMG.hero,
      imageAlt: "Model wearing the new summer collection",
      sticker: "50% OFF",
    },
  },
  {
    type: "features_row",
    settingsJson: {
      items: [
        { icon: "📦", title: "Free Shipping", text: "Free shipping for orders above $180" },
        { icon: "💳", title: "Flexible Payment", text: "Multiple secure payment options" },
        { icon: "🎧", title: "24x7 Support", text: "We support online all days" },
      ],
    },
  },
  {
    type: "fashion_categories",
    settingsJson: {
      items: [
        {
          badge: "2500+ Items",
          title: "For Women's",
          text: "Elegant styles for every occasion.",
          lines: ["Blazers", "T-Shirts and Blouses", "Dresses", "Jackets & Coats", "Jeans", "Sarees"],
          image: IMG.women,
          link: "?page=shop",
        },
        {
          badge: "1500+ Items",
          title: "For Men's",
          text: "Sharp, comfortable, everyday wear.",
          lines: ["Blazers", "T-Shirts and Shirts", "Jackets & Coats"],
          image: IMG.men,
          link: "?page=shop",
        },
        {
          badge: "800+ Items",
          title: "Accessories",
          text: "Finish every look perfectly.",
          lines: ["Handbags", "Watches", "Sunglasses", "Hats"],
          image: IMG.accessories,
          link: "?page=shop",
        },
      ],
    },
  },
  {
    type: "promo_banner",
    settingsJson: {
      kicker: "Limited Time Offers",
      heading: "25% Off All Fashion Favorites — Limited Time!",
      body: "Refresh your wardrobe with the season's most-loved pieces. Offer ends soon — don't miss out.",
      ctaText: "Shop Now",
      ctaLink: "?page=shop",
      image: IMG.promo,
      imageAlt: "Limited time fashion offer",
      imageSide: "right",
    },
  },
  {
    type: "deals_of_day",
    settingsJson: {
      kicker: "Today Only",
      heading: "Deals of the Day",
      subtext: "Hand-picked offers refreshed daily — premium pieces at their best price.",
      limit: 4,
    },
  },
  {
    type: "top_sellers",
    settingsJson: {
      kicker: "Our Products",
      heading: "Our Top Seller Products",
      limit: 8,
    },
  },
  {
    type: "newsletter_signup",
    settingsJson: {
      heading: "Stay in Style",
      subtext: "Subscribe for new drops, exclusive offers and style inspiration.",
      ctaText: "Subscribe",
    },
  },
];

/**
 * POST /api/v1/admin/apply-clothing-template — one-click clothing storefront:
 * 1. Applies the clothing palette/typography to the active theme.
 * 2. Rebuilds the Home page with the fashion sections (all editable afterwards).
 */
export async function POST(req: Request) {
  const tenant = await resolveTenant(req);
  if (!tenant) return tenantNotFound();

  // 1. Theme: apply the clothing look to the active (or first) theme row.
  const theme =
    (await prisma.theme.findFirst({ where: { tenantId: tenant.id, isActive: true, deletedAt: null } })) ??
    (await prisma.theme.findFirst({ where: { tenantId: tenant.id, deletedAt: null } }));
  if (theme) {
    await prisma.theme.update({
      where: { id: theme.id },
      data: {
        ...sanitizeTokens(DEFAULT_THEME_TOKENS as unknown as Record<string, unknown>),
        isActive: true,
        publishedAt: new Date(),
      },
    });
  }

  // 2. Home page: create if missing, then replace its sections.
  let page = await prisma.page.findFirst({
    where: { tenantId: tenant.id, slug: "home", deletedAt: null },
  });
  if (!page) {
    page = await prisma.page.create({
      data: {
        tenantId: tenant.id,
        title: "Home",
        slug: "home",
        type: "home",
        status: "published",
        publishedAt: new Date(),
      },
    });
  }

  await prisma.section.updateMany({
    where: { pageId: page.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  for (let i = 0; i < TEMPLATE_SECTIONS.length; i++) {
    const t = TEMPLATE_SECTIONS[i];
    await prisma.section.create({
      data: {
        pageId: page.id,
        tenantId: tenant.id,
        // Cast: the enum includes these values after the fashion migration.
        type: t.type as never,
        order: i,
        isVisible: true,
        settingsJson: t.settingsJson,
      },
    });
  }

  return Response.json({
    data: { pageId: page.id, sections: TEMPLATE_SECTIONS.length, themeUpdated: Boolean(theme) },
  });
}
