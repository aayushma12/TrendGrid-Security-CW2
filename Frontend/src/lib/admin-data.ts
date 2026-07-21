/**
 * NDH TrendGrid — Admin panel seed data (client-side, UI-only).
 * ---------------------------------------------------------------------------
 * The admin panels operate on local React state seeded from these values.
 * Nothing here is persisted — edits live for the session only. Shapes mirror
 * the Prisma models (Category, Product, Order, StoreSettings) so this can be
 * swapped for real API calls later without touching the UI.
 */

import { PRODUCTS, STORE, type ShopProduct } from "./shop-data";

/* ------------------------------------------------------------------ types */

export type Status = "active" | "draft" | "archived";

export interface HomeSection {
  id: string;
  /** Component key on the storefront homepage. */
  key: string;
  name: string;
  description: string;
  visible: boolean;
  /** Primary editable copy for the section (heading / label). */
  heading: string;
  subtext: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  visible: boolean;
  sortOrder: number;
  /** Derived product count (recomputed in the UI). */
  productCount: number;
}

export interface AdminProduct {
  id: string;
  title: string;
  sku: string;
  category: string;
  audience: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  status: Status;
  featured: boolean;
  rating: number;
  reviews: number;
  tone: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type FulfillmentStatus = "unfulfilled" | "partial" | "fulfilled";

export interface AdminOrderItem {
  title: string;
  qty: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  status: OrderStatus;
  payment: PaymentStatus;
  fulfillment: FulfillmentStatus;
  total: number;
  items: AdminOrderItem[];
  city: string;
  createdAt: string; // ISO
}

export interface CheckoutSettings {
  freeShippingOver: number;
  flatShipping: number;
  currency: string;
  currencySymbol: string;
  taxRate: number; // percent
  guestCheckout: boolean;
  requirePhone: boolean;
  orderNotes: boolean;
  payments: { key: string; label: string; enabled: boolean }[];
  fields: { key: string; label: string; required: boolean; enabled: boolean }[];
}

/* ------------------------------------------------------------- home page */

export const HOME_SECTIONS: HomeSection[] = [
  { id: "sec_header", key: "NexaHeader", name: "Header / Navbar", description: "Top navigation, logo and cart", visible: true, heading: "Clothing.", subtext: "Sign up and GET 25% OFF for your first order." },
  { id: "sec_hero", key: "NexaHero", name: "Hero", description: "Masked word-stagger hero banner", visible: true, heading: "Step into Style", subtext: "Discover fashion that moves with you — timeless design for every day." },
  { id: "sec_marquee", key: "NexaMarquee", name: "Marquee Strip", description: "Scrolling announcement strip", visible: true, heading: "New Season · Free Shipping over $180 · 24×7 Support", subtext: "" },
  { id: "sec_categories", key: "NexaCategories", name: "Categories", description: "Tabbed category product grid", visible: true, heading: "Shape Your Signature Style", subtext: "Browse fashion categories and explore outfits that match your personality." },
  { id: "sec_arrivals", key: "NexaArrivals", name: "New Arrivals", description: "Horizontal snap-scroll rail", visible: true, heading: "New Arrivals", subtext: "Fresh drops — scroll sideways to browse." },
  { id: "sec_about", key: "NexaAbout", name: "About / Brand Story", description: "Brand narrative with milestones", visible: true, heading: "Crafted with intention, worn with confidence", subtext: "From a single atelier to a modern wardrobe house." },
  { id: "sec_lookbook", key: "NexaLookbook", name: "Lookbook", description: "Editorial season lookbook", visible: true, heading: "Summer 2026 — Designed for modern confidence", subtext: "" },
  { id: "sec_brands", key: "NexaBrands", name: "Brand Logos", description: "Partner / brand logo strip", visible: true, heading: "As seen in", subtext: "" },
  { id: "sec_testimonials", key: "NexaTestimonials", name: "Testimonials", description: "Customer reviews carousel", visible: true, heading: "Loved by thousands", subtext: "Real words from people who wear us every day." },
  { id: "sec_cta", key: "NexaCta", name: "Call to Action", description: "Newsletter / promo CTA band", visible: true, heading: "Join the list, get 25% off", subtext: "Be first to shop new drops and members-only offers." },
  { id: "sec_faq", key: "NexaFaq", name: "FAQ", description: "Accordion of common questions", visible: true, heading: "Frequently asked questions", subtext: "" },
  { id: "sec_features", key: "NexaFeatures", name: "Features / Trust", description: "Shipping, payment, support badges", visible: true, heading: "Why shop with us", subtext: "" },
  { id: "sec_footer", key: "NexaFooter", name: "Footer", description: "Links, contact and socials", visible: true, heading: "Clothing.", subtext: "8502 Preston Rd. Inglewood, Maine 98380" },
];

/* ------------------------------------------------------------- categories */

const CATEGORY_META: Record<string, { description: string; image: string }> = {
  Coats: { description: "Outerwear and statement coats for every season.", image: "camel-coat-editorial" },
  Dresses: { description: "From day dresses to evening silhouettes.", image: "evening-dress-editorial" },
  Shirt: { description: "Everyday shirts and blouses, tailored to fit.", image: "ivory-suit-editorial" },
  Sweater: { description: "Soft knits and cosy layers.", image: "lookbook-editorial-1" },
  Suit: { description: "Modern tailoring for work and beyond.", image: "city-tailoring-editorial" },
  Accessories: { description: "Bags, watches and finishing touches.", image: "gold-accessories-editorial" },
};

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

const CATEGORY_NAMES = Array.from(new Set(PRODUCTS.map((p) => p.category)));

export const ADMIN_CATEGORIES: AdminCategory[] = CATEGORY_NAMES.map((name, i) => ({
  id: `cat_${slugify(name)}`,
  name,
  slug: slugify(name),
  description: CATEGORY_META[name]?.description ?? "",
  image: CATEGORY_META[name]?.image ?? "lookbook-editorial-1",
  visible: true,
  sortOrder: i + 1,
  productCount: PRODUCTS.filter((p) => p.category === name).length,
}));

/* --------------------------------------------------------------- products */

function seededStock(p: ShopProduct): number {
  // Deterministic pseudo-stock from the SKU so it's stable across renders.
  const n = p.sku.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return p.inStock ? 5 + (n % 60) : 0;
}

export const ADMIN_PRODUCTS: AdminProduct[] = PRODUCTS.map((p) => ({
  id: p.id,
  title: p.name,
  sku: p.sku,
  category: p.category,
  audience: p.audience,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  stock: seededStock(p),
  status: p.inStock ? "active" : "draft",
  featured: p.rating >= 4.9,
  rating: p.rating,
  reviews: p.reviews,
  tone: p.tone,
}));

/* ----------------------------------------------------------------- orders */

const CUSTOMERS = [
  { name: "Amara Kembe", email: "amara@example.com", city: "Inglewood" },
  { name: "Daniel Rossi", email: "daniel@example.com", city: "Portland" },
  { name: "Sofia Lund", email: "sofia@example.com", city: "Austin" },
  { name: "Noah Park", email: "noah@example.com", city: "Denver" },
  { name: "Mia Chen", email: "mia@example.com", city: "Seattle" },
  { name: "Liam Novak", email: "liam@example.com", city: "Boston" },
  { name: "Emma Diaz", email: "emma@example.com", city: "Miami" },
  { name: "Owen Fischer", email: "owen@example.com", city: "Chicago" },
];

const ORDER_STATES: OrderStatus[] = ["pending", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"];

function daysAgoISO(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

export const ADMIN_ORDERS: AdminOrder[] = Array.from({ length: 14 }).map((_, i) => {
  const cust = CUSTOMERS[i % CUSTOMERS.length];
  const p1 = PRODUCTS[i % PRODUCTS.length];
  const p2 = PRODUCTS[(i * 3 + 2) % PRODUCTS.length];
  const items: AdminOrderItem[] =
    i % 3 === 0
      ? [
          { title: p1.name, qty: 1 + (i % 2), price: p1.price },
          { title: p2.name, qty: 1, price: p2.price },
        ]
      : [{ title: p1.name, qty: 1 + (i % 3), price: p1.price }];
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const status = ORDER_STATES[i % ORDER_STATES.length];
  const payment: PaymentStatus =
    status === "refunded" ? "refunded" : status === "cancelled" ? "failed" : status === "pending" ? "pending" : "paid";
  const fulfillment: FulfillmentStatus =
    status === "delivered" || status === "shipped" ? "fulfilled" : status === "packed" ? "partial" : "unfulfilled";
  return {
    id: `ord_${1000 + i}`,
    orderNumber: `TG-${1042 - i}`,
    customer: cust.name,
    email: cust.email,
    status,
    payment,
    fulfillment,
    total,
    items,
    city: cust.city,
    createdAt: daysAgoISO(i * 2 + (i % 3)),
  };
});

/* --------------------------------------------------------------- checkout */

export const CHECKOUT_SETTINGS: CheckoutSettings = {
  freeShippingOver: STORE.freeShippingOver,
  flatShipping: 10,
  currency: "USD",
  currencySymbol: "$",
  taxRate: 0,
  guestCheckout: true,
  requirePhone: true,
  orderNotes: true,
  payments: [
    { key: "card", label: "Credit / Debit Card", enabled: true },
    { key: "paypal", label: "PayPal", enabled: true },
    { key: "gpay", label: "Google Pay", enabled: false },
    { key: "cod", label: "Cash on Delivery", enabled: true },
  ],
  fields: [
    { key: "firstName", label: "First name", required: true, enabled: true },
    { key: "lastName", label: "Last name", required: true, enabled: true },
    { key: "email", label: "Email", required: true, enabled: true },
    { key: "phone", label: "Phone", required: true, enabled: true },
    { key: "address1", label: "Address line 1", required: true, enabled: true },
    { key: "address2", label: "Address line 2", required: false, enabled: true },
    { key: "city", label: "City", required: true, enabled: true },
    { key: "state", label: "State / Province", required: true, enabled: true },
    { key: "zip", label: "ZIP / Postal code", required: true, enabled: true },
    { key: "company", label: "Company", required: false, enabled: false },
  ],
};

export const ORDER_STATUS_LIST = ORDER_STATES;

/* ================================================================= MARKETING */

/* ---------------------------------------------------------------- coupons */

export type CouponType = "percentage" | "fixed" | "freeShipping" | "buyXgetY";

export interface AdminCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // % for percentage, $ for fixed, ignored for freeShipping
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startsAt: string; // ISO date (yyyy-mm-dd)
  expiresAt: string; // ISO date
  isActive: boolean;
  appliesTo: string; // "All products" or a category name
}

export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  percentage: "Percentage off",
  fixed: "Fixed amount off",
  freeShipping: "Free shipping",
  buyXgetY: "Buy X get Y",
};

function isoDate(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

export const ADMIN_COUPONS: AdminCoupon[] = [
  { id: "cpn_welcome25", code: "WELCOME25", type: "percentage", value: 25, minOrderAmount: 0, maxDiscountAmount: 80, usageLimit: 1000, usageCount: 342, perUserLimit: 1, startsAt: isoDate(-30), expiresAt: isoDate(60), isActive: true, appliesTo: "All products" },
  { id: "cpn_free180", code: "FREESHIP", type: "freeShipping", value: 0, minOrderAmount: 120, maxDiscountAmount: null, usageLimit: null, usageCount: 921, perUserLimit: null, startsAt: isoDate(-90), expiresAt: isoDate(180), isActive: true, appliesTo: "All products" },
  { id: "cpn_coats20", code: "COATS20", type: "fixed", value: 20, minOrderAmount: 100, maxDiscountAmount: null, usageLimit: 500, usageCount: 118, perUserLimit: 2, startsAt: isoDate(-10), expiresAt: isoDate(20), isActive: true, appliesTo: "Coats" },
  { id: "cpn_summer", code: "SUMMER10", type: "percentage", value: 10, minOrderAmount: 50, maxDiscountAmount: 40, usageLimit: 2000, usageCount: 1987, perUserLimit: 1, startsAt: isoDate(-60), expiresAt: isoDate(-2), isActive: false, appliesTo: "All products" },
  { id: "cpn_bogo", code: "BOGOTEE", type: "buyXgetY", value: 1, minOrderAmount: 0, maxDiscountAmount: null, usageLimit: 300, usageCount: 44, perUserLimit: 1, startsAt: isoDate(-5), expiresAt: isoDate(15), isActive: true, appliesTo: "Shirt" },
];

/* ---------------------------------------------------------------- banners */

export type BannerPlacement = "announcement" | "hero" | "promo";

export interface AdminBanner {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  textColor: string;
  startsAt: string;
  expiresAt: string;
  active: boolean;
}

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  announcement: "Announcement bar",
  hero: "Hero banner",
  promo: "Promo strip",
};

export const ADMIN_BANNERS: AdminBanner[] = [
  { id: "bnr_ann1", placement: "announcement", title: "Sign up and GET 25% OFF your first order", subtext: "Use code WELCOME25 at checkout", ctaText: "Sign up now", ctaLink: "/account", bgColor: "#101828", textColor: "#ffffff", startsAt: isoDate(-30), expiresAt: isoDate(60), active: true },
  { id: "bnr_ann2", placement: "announcement", title: "Complimentary shipping on orders over $180", subtext: "", ctaText: "Shop now", ctaLink: "/shop", bgColor: "#4f46e5", textColor: "#ffffff", startsAt: isoDate(-10), expiresAt: isoDate(30), active: false },
  { id: "bnr_hero1", placement: "hero", title: "Summer 2026 Collection", subtext: "Designed for modern confidence", ctaText: "Explore the drop", ctaLink: "/shop", bgColor: "#dcfce7", textColor: "#101828", startsAt: isoDate(-5), expiresAt: isoDate(45), active: true },
  { id: "bnr_promo1", placement: "promo", title: "Private Sale — up to 40% off", subtext: "Ends tonight at midnight", ctaText: "Grab the deals", ctaLink: "/shop", bgColor: "#fef3c7", textColor: "#7c2d12", startsAt: isoDate(0), expiresAt: isoDate(1), active: true },
];

/* ----------------------------------------------------------------- reviews */

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface AdminReview {
  id: string;
  product: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: string;
}

export const ADMIN_REVIEWS: AdminReview[] = [
  { id: "rv_1", product: "Trendy Brown Coat", author: "Amara K.", rating: 5, title: "Beautiful weight and finish", body: "The coat is even better in person — gorgeous fabric and it fits perfectly.", status: "approved", verifiedPurchase: true, createdAt: isoDate(-3) },
  { id: "rv_2", product: "Modern Black Dress", author: "Sofia L.", rating: 5, title: "Obsessed", body: "Already ordering a second one. Quality is unreal for the price.", status: "pending", verifiedPurchase: true, createdAt: isoDate(-1) },
  { id: "rv_3", product: "Classic White Shirt", author: "Daniel R.", rating: 4, title: "Great fit", body: "Lovely tailoring, though shipping took a couple of extra days.", status: "pending", verifiedPurchase: true, createdAt: isoDate(-2) },
  { id: "rv_4", product: "Classic Gold Watch", author: "Anon", rating: 1, title: "Spam link inside", body: "Check out cheap-watches dot biz for better deals!!!", status: "rejected", verifiedPurchase: false, createdAt: isoDate(-4) },
  { id: "rv_5", product: "Light Brown Sweter", author: "Mia C.", rating: 5, title: "So cosy", body: "Perfect autumn knit, soft and warm.", status: "approved", verifiedPurchase: true, createdAt: isoDate(-6) },
  { id: "rv_6", product: "Leather Hand Bag", author: "Emma D.", rating: 3, title: "Nice but smaller than expected", body: "Good leather, just check the dimensions before buying.", status: "pending", verifiedPurchase: false, createdAt: isoDate(-1) },
];

/* --------------------------------------------------------------- customers */

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string;
  segment: "VIP" | "Returning" | "New" | "At risk";
  marketingOptIn: boolean;
}

const SEGMENTS: AdminCustomer["segment"][] = ["VIP", "Returning", "New", "At risk"];

export const ADMIN_CUSTOMERS: AdminCustomer[] = [
  { name: "Amara Kembe", email: "amara@example.com", city: "Inglewood" },
  { name: "Daniel Rossi", email: "daniel@example.com", city: "Portland" },
  { name: "Sofia Lund", email: "sofia@example.com", city: "Austin" },
  { name: "Noah Park", email: "noah@example.com", city: "Denver" },
  { name: "Mia Chen", email: "mia@example.com", city: "Seattle" },
  { name: "Liam Novak", email: "liam@example.com", city: "Boston" },
  { name: "Emma Diaz", email: "emma@example.com", city: "Miami" },
  { name: "Owen Fischer", email: "owen@example.com", city: "Chicago" },
].map((c, i): AdminCustomer => {
  const totalOrders = 1 + ((i * 3) % 9);
  const totalSpent = 60 + ((i * 137) % 900);
  const segment: AdminCustomer["segment"] =
    totalSpent > 600 ? "VIP" : totalOrders >= 4 ? "Returning" : i % 4 === 3 ? "At risk" : SEGMENTS[i % SEGMENTS.length];
  return {
    id: `cus_${i + 1}`,
    name: c.name,
    email: c.email,
    totalOrders,
    totalSpent,
    lastOrderAt: isoDate(-(i * 4 + 1)),
    segment,
    marketingOptIn: i % 3 !== 0,
  };
});

/* ============================================================ HOMEPAGE CMS */
/**
 * Schema-driven content for every homepage section, so the admin can edit all
 * copy + imagery from one place. Categories, banners and products are managed
 * in their own panels — those sections carry only a heading + a `note`.
 */

export type HomeFieldType = "text" | "textarea" | "image";

export interface HomeField {
  key: string;
  label: string;
  type: HomeFieldType;
  value: string;
}

export interface HomeRepeaterFieldDef {
  key: string;
  label: string;
  type: HomeFieldType;
}

export interface HomeRepeater {
  key: string;
  label: string;
  itemNoun: string;
  itemFields: HomeRepeaterFieldDef[];
  items: Record<string, string>[];
}

export interface HomeSectionContent {
  /** Optional inline note, e.g. "Tiles are managed in Categories". */
  note?: string;
  fields: HomeField[];
  repeaters: HomeRepeater[];
}

const t = (key: string, label: string, value: string): HomeField => ({ key, label, type: "text", value });
const area = (key: string, label: string, value: string): HomeField => ({ key, label, type: "textarea", value });
const img = (key: string, label: string, value: string): HomeField => ({ key, label, type: "image", value });

export const HOME_CONTENT: Record<string, HomeSectionContent> = {
  sec_header: {
    note: "The announcement bar is managed in Banners; navigation targets in Settings.",
    fields: [t("brand", "Brand name", "TrendGrid")],
    repeaters: [
      {
        key: "nav",
        label: "Navigation links",
        itemNoun: "link",
        itemFields: [t("label", "Label", ""), t("href", "URL", "")],
        items: [
          { label: "Home", href: "/" },
          { label: "Collections", href: "/shop" },
          { label: "Brand", href: "/shop" },
          { label: "Contact", href: "/contact" },
        ],
      },
    ],
  },
  sec_hero: {
    fields: [
      t("eyebrow", "Eyebrow", "New Season Collection 2026"),
      t("titleLine1", "Title line 1", "Elevate Your"),
      t("titleLine2", "Title line 2", "Signature"),
      t("titleAccent", "Title accent word", "Style"),
      area("copy", "Body copy", "Explore modern fashion with carefully selected styles designed for every moment and lifestyle — premium fabrics, timeless cuts, zero compromise."),
      t("ctaPrimary", "Primary button", "Explore Collection"),
      t("ctaSecondary", "Secondary button", "Browse Categories"),
      img("image", "Hero image", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=880&h=1100&fit=crop&crop=faces,center&auto=format&q=75"),
    ],
    repeaters: [
      {
        key: "stats",
        label: "Proof stats",
        itemNoun: "stat",
        itemFields: [t("value", "Value", ""), t("label", "Label", "")],
        items: [
          { value: "25K+", label: "Happy Shoppers" },
          { value: "9.5/10", label: "Avg. Rating" },
        ],
      },
    ],
  },
  sec_marquee: {
    fields: [],
    repeaters: [
      {
        key: "items",
        label: "Marquee items",
        itemNoun: "item",
        itemFields: [t("text", "Text", "")],
        items: ["Streetwear", "Classic Formal", "Everyday Essentials", "Sports & Active", "Modern Bottoms", "Premium Outerwear"].map((x) => ({ text: x })),
      },
    ],
  },
  sec_categories: {
    note: "Category tiles are managed in Categories — this edits the section heading only.",
    fields: [
      t("heading", "Heading", "Shape Your Signature Style"),
      area("subtext", "Subtext", "Browse fashion categories and explore outfits that match your personality."),
    ],
    repeaters: [],
  },
  sec_arrivals: {
    note: "Products come from Products — this edits the section heading only.",
    fields: [
      t("heading", "Heading", "New Arrivals"),
      area("subtext", "Subtext", "Fresh drops — scroll sideways to browse."),
    ],
    repeaters: [],
  },
  sec_about: {
    fields: [
      t("eyebrow", "Eyebrow", "About us"),
      t("ctaText", "Button text", "Learn More About Us"),
      area("heading", "Heading", "Where Timeless Heritage Meets Refined Modern Craftsmanship"),
      img("image1", "Photo 1", "street style jacket city"),
      img("image2", "Photo 2", "tailored coat fitting boutique"),
    ],
    repeaters: [
      {
        key: "stats",
        label: "Stats",
        itemNoun: "stat",
        itemFields: [t("value", "Value", ""), t("label", "Label", "")],
        items: [
          { value: "245K", label: "Style Inspired Users" },
          { value: "9.5/10", label: "Customer Satisfaction" },
        ],
      },
    ],
  },
  sec_lookbook: {
    fields: [
      t("kicker", "Kicker", "Lookbook"),
      area("heading", "Heading", "Summer 2026 — Designed for modern confidence"),
    ],
    repeaters: [
      {
        key: "frames",
        label: "Lookbook frames",
        itemNoun: "frame",
        itemFields: [t("season", "Chapter", ""), t("title", "Title", ""), img("seed", "Image", "")],
        items: [
          { season: "Chapter 01", title: "Sun-Bleached Neutrals", seed: "lookbook-editorial-1" },
          { season: "Chapter 02", title: "After Dark", seed: "lookbook-editorial-2" },
          { season: "Chapter 03", title: "City Tailoring", seed: "lookbook-editorial-3" },
        ],
      },
    ],
  },
  sec_brands: {
    fields: [t("label", "Label", "As featured in")],
    repeaters: [
      {
        key: "brands",
        label: "Brand names",
        itemNoun: "brand",
        itemFields: [t("name", "Name", "")],
        items: ["VOGUE", "GQ", "ESQUIRE", "HYPEBEAST", "COMPLEX", "HIGHSNOBIETY"].map((x) => ({ name: x })),
      },
    ],
  },
  sec_testimonials: {
    fields: [
      t("heading", "Heading", "Smarter Fashion Starts Here"),
      area("subtext", "Subtext", "See why modern shoppers trust our premium fashion experience and everyday style collections."),
    ],
    repeaters: [
      {
        key: "quotes",
        label: "Testimonials",
        itemNoun: "testimonial",
        itemFields: [t("name", "Name", ""), area("text", "Quote", ""), img("seed", "Avatar", "")],
        items: [
          { name: "Daniel Carter", text: "The clean stitching and premium fit make every outfit feel stylish and comfortable all day.", seed: "men avatar daniel shirt" },
          { name: "Ryan Mitchell", text: "Excellent fabric quality with a modern look that instantly upgrades my wardrobe.", seed: "men avatar ryan coat" },
          { name: "Ethan Walker", text: "Minimal, classy, and incredibly comfortable — exactly what I look for in fashion.", seed: "men avatar ethan suit" },
          { name: "Lucas Bennett", text: "The details, fit, and overall design feel premium and worth every penny.", seed: "men avatar lucas sweater" },
        ],
      },
    ],
  },
  sec_cta: {
    fields: [
      t("eyebrow", "Eyebrow", "Limited Offer"),
      t("title", "Title", "Get 25% Off Your First Order"),
      area("copy", "Copy", "Join 25K+ members and unlock early access to drops, styling tips, and member-only pricing."),
      t("ctaPrimary", "Primary button", "Claim the Offer"),
      t("ctaSecondary", "Secondary button", "Talk to a Stylist"),
    ],
    repeaters: [],
  },
  sec_faq: {
    fields: [t("heading", "Heading", "Frequently asked questions")],
    repeaters: [
      {
        key: "items",
        label: "Questions",
        itemNoun: "question",
        itemFields: [t("q", "Question", ""), area("a", "Answer", "")],
        items: [
          { q: "How can I place an order?", a: "Browse the shop, add items to your cart, then proceed to checkout and choose your preferred payment method." },
          { q: "What payment methods do you accept?", a: "We accept PayPal, all major credit/debit cards, Google Pay and Cash on Delivery." },
          { q: "Can I track my order after it's been placed?", a: "Yes — once your order ships you'll receive a tracking number via email." },
          { q: "What is your return policy?", a: "Items can be returned within 30 days of delivery in their original condition." },
        ],
      },
    ],
  },
  sec_features: {
    fields: [t("heading", "Heading (screen-reader)", "Why shop with us")],
    repeaters: [
      {
        key: "items",
        label: "Feature cards",
        itemNoun: "feature",
        itemFields: [t("title", "Title", ""), area("text", "Text", "")],
        items: [
          { title: "Free Shipping", text: "On every order over $180, delivered fast." },
          { title: "Easy 30-Day Returns", text: "Changed your mind? Send it back free within 30 days." },
          { title: "Secure Checkout", text: "Encrypted payments with cards, wallets, and COD." },
          { title: "Human Support", text: "Real stylists on (406) 555-0120, Mon–Sat." },
        ],
      },
    ],
  },
  sec_footer: {
    fields: [
      t("brand", "Brand name", "TrendGrid"),
      area("tagline", "Tagline", "Fewer, better things — timeless design you'll reach for season after season."),
      t("email", "Email", "example@gmail.com"),
      t("phone", "Phone", "+0123-456-789"),
      t("address", "Address", "8502 Preston Rd. Inglewood, Maine 98380"),
      t("copyright", "Copyright", "© 2026 TrendGrid. All rights reserved."),
    ],
    repeaters: [
      {
        key: "links",
        label: "Footer links",
        itemNoun: "link",
        itemFields: [t("label", "Label", ""), t("href", "URL", "")],
        items: [
          { label: "Shop", href: "/shop" },
          { label: "About", href: "/shop" },
          { label: "Contact", href: "/contact" },
          { label: "FAQ", href: "/#faq" },
        ],
      },
    ],
  },
};
