/**
 * Static demo data for the storefront (user side).
 * Content only — every visual property is driven by global theme tokens.
 */

export type Category =
  | "Coats"
  | "Dresses"
  | "Shirt"
  | "Sweater"
  | "Suit"
  | "Accessories";

export type Audience = "Women" | "Men" | "Accessories";

export interface ShopProduct {
  id: string;
  name: string;
  category: Category;
  audience: Audience;
  price: number;
  compareAtPrice: number;
  rating: number;
  reviews: number;
  colors: string[];
  sizes: string[];
  /** Tone used by the SVG placeholder image. */
  tone: string;
  sku: string;
  tags: string[];
  inStock: boolean;
}

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];

export const PRODUCTS: ShopProduct[] = [
  { id: "trendy-brown-coat", name: "Trendy Brown Coat", category: "Coats", audience: "Women", price: 75, compareAtPrice: 150, rating: 4.8, reviews: 245, colors: ["Brown", "White", "Green", "Red", "Blue"], sizes: SIZES, tone: "#7B4B2A", sku: "GHFT95245AAA", tags: ["Women", "Coat", "Fashion", "Jacket"], inStock: true },
  { id: "classy-light-coat", name: "Classy Light Coat", category: "Coats", audience: "Women", price: 165, compareAtPrice: 220, rating: 4.9, reviews: 188, colors: ["Cream", "Brown", "Black"], sizes: SIZES, tone: "#D9C7A7", sku: "GHFT95246AAB", tags: ["Women", "Coat", "Winter"], inStock: true },
  { id: "modern-brown-dress", name: "Modern Brown Dress", category: "Dresses", audience: "Women", price: 90, compareAtPrice: 100, rating: 4.8, reviews: 132, colors: ["Brown", "Black"], sizes: SIZES, tone: "#6E3B2C", sku: "GHFT95247AAC", tags: ["Women", "Dress"], inStock: true },
  { id: "modern-black-dress", name: "Modern Black Dress", category: "Dresses", audience: "Women", price: 75, compareAtPrice: 100, rating: 4.9, reviews: 164, colors: ["Black"], sizes: SIZES, tone: "#2A2326", sku: "GHFT95248AAD", tags: ["Women", "Dress", "Party"], inStock: true },
  { id: "light-brown-sweter", name: "Light Brown Sweter", category: "Sweater", audience: "Women", price: 63, compareAtPrice: 70, rating: 4.7, reviews: 98, colors: ["Light Brown", "Grey"], sizes: SIZES, tone: "#C9B295", sku: "GHFT95249AAE", tags: ["Women", "Sweater"], inStock: true },
  { id: "classic-white-shirt", name: "Classic White Shirt", category: "Shirt", audience: "Women", price: 45, compareAtPrice: 50, rating: 5.0, reviews: 211, colors: ["White"], sizes: SIZES, tone: "#EFEAE2", sku: "GHFT95250AAF", tags: ["Women", "Shirt"], inStock: true },
  { id: "dark-yellow-shirt", name: "Dark Yellow Shirt", category: "Shirt", audience: "Women", price: 75, compareAtPrice: 100, rating: 4.8, reviews: 76, colors: ["Orange", "White"], sizes: SIZES, tone: "#C98A3B", sku: "GHFT95251AAG", tags: ["Women", "Shirt"], inStock: true },
  { id: "classic-white-shirt-2", name: "Classic White Shirt", category: "Shirt", audience: "Women", price: 70, compareAtPrice: 100, rating: 4.9, reviews: 143, colors: ["White"], sizes: SIZES, tone: "#F2EEE7", sku: "GHFT95252AAH", tags: ["Women", "Shirt"], inStock: true },
  { id: "modern-white-suit", name: "Modern White Suit", category: "Suit", audience: "Women", price: 90, compareAtPrice: 100, rating: 4.9, reviews: 121, colors: ["White", "Black"], sizes: SIZES, tone: "#E8E4DC", sku: "GHFT95253AAI", tags: ["Women", "Suit"], inStock: true },
  { id: "classic-black-shirt", name: "Classic Black Shirt", category: "Shirt", audience: "Men", price: 45, compareAtPrice: 50, rating: 5.0, reviews: 167, colors: ["Black"], sizes: SIZES, tone: "#26212A", sku: "GHFT95254AAJ", tags: ["Men", "Shirt"], inStock: true },
  { id: "light-brown-sweter-2", name: "Light Brown Sweter", category: "Sweater", audience: "Men", price: 64, compareAtPrice: 80, rating: 5.0, reviews: 89, colors: ["Light Brown"], sizes: SIZES, tone: "#CBA77C", sku: "GHFT95255AAK", tags: ["Men", "Sweater"], inStock: true },
  { id: "light-grey-sweter", name: "Light Grey Sweter", category: "Sweater", audience: "Men", price: 40, compareAtPrice: 50, rating: 5.0, reviews: 102, colors: ["Grey", "White"], sizes: SIZES, tone: "#BDBCB8", sku: "GHFT95256AAL", tags: ["Men", "Sweater"], inStock: true },
  { id: "brown-winter-coat", name: "Brown Winter Coat", category: "Coats", audience: "Women", price: 60, compareAtPrice: 100, rating: 4.8, reviews: 154, colors: ["Brown", "Cream"], sizes: SIZES, tone: "#8A5A33", sku: "GHFT95257AAM", tags: ["Women", "Coat", "Winter"], inStock: true },
  { id: "stylist-dress", name: "Stylist Dress", category: "Dresses", audience: "Women", price: 75, compareAtPrice: 150, rating: 4.8, reviews: 118, colors: ["Pink", "Red"], sizes: SIZES, tone: "#C77B8B", sku: "GHFT95258AAN", tags: ["Women", "Dress"], inStock: true },
  { id: "modern-party-dress", name: "Modern Party Dress", category: "Dresses", audience: "Women", price: 80, compareAtPrice: 100, rating: 4.9, reviews: 137, colors: ["Cream", "Brown"], sizes: SIZES, tone: "#D8B98E", sku: "GHFT95259AAO", tags: ["Women", "Dress", "Party"], inStock: true },
  { id: "leather-hand-bag", name: "Leather Hand Bag", category: "Accessories", audience: "Accessories", price: 55, compareAtPrice: 80, rating: 4.7, reviews: 64, colors: ["Brown", "Black"], sizes: ["One Size"], tone: "#9A6A3F", sku: "GHFT95260AAP", tags: ["Accessories", "Bag"], inStock: true },
  { id: "classic-gold-watch", name: "Classic Gold Watch", category: "Accessories", audience: "Accessories", price: 120, compareAtPrice: 160, rating: 4.9, reviews: 83, colors: ["Gold"], sizes: ["One Size"], tone: "#C9A24B", sku: "GHFT95261AAQ", tags: ["Accessories", "Watch"], inStock: true },
];

export function getProduct(id: string): ShopProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function discountPct(p: ShopProduct): number {
  return Math.round((1 - p.price / p.compareAtPrice) * 100);
}

export function relatedProducts(p: ShopProduct, n = 4): ShopProduct[] {
  return PRODUCTS.filter((x) => x.id !== p.id)
    .sort((a, b) => (a.category === p.category ? -1 : 0) - (b.category === p.category ? -1 : 0))
    .slice(0, n);
}

/* ---------------------------------------------------------------- content */

export const STORE = {
  name: "Clothing.",
  supportPhone: "(406) 555-0120",
  promo: "Sign up and GET 25% OFF for your first order.",
  promoLink: "Sign up now",
  address: "8502 Preston Rd. Inglewood, Maine 98380",
  email: "example@gmail.com",
  phone: "+0123-456-789",
  freeShippingOver: 180,
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Women", href: "/shop?audience=Women" },
  { label: "Men", href: "/shop?audience=Men" },
  { label: "Accessories", href: "/shop?audience=Accessories" },
  { label: "About Us", href: "/shop" },
  { label: "Contact Us", href: "/shop" },
  { label: "Blog", href: "/shop" },
];

export const CATEGORY_TILES = [
  { title: "For Women's", count: "2500+ Items", items: ["Tops and Blouses", "Blazers", "T-Shirts and Blouses", "Dresses", "Jackets & Coats", "Jeans", "Skirts"], href: "/shop?audience=Women" },
  { title: "For Men's", count: "1500+ Items", items: ["Blazers", "T-Shirts and Shirts", "Jackets & Coats", "Jeans"], href: "/shop?audience=Men" },
  { title: "Accessories", count: "800+ Items", items: ["Handbags", "Watches", "Sunglasses", "Hat"], href: "/shop?audience=Accessories" },
];

export const FEATURES = [
  { title: "Free Shipping", text: "Free shipping for order above $180", icon: "shipping" },
  { title: "Flexible Payment", text: "Multiple secure payment options", icon: "payment" },
  { title: "24x7 Support", text: "We support online all days.", icon: "support" },
];

export const TESTIMONIAL = {
  quote:
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto.",
  name: "Leslie Alexander",
  role: "Fashion Enthusiast",
  rating: 5.0,
};

export const BLOG_POSTS = [
  { title: "10 Fashion Trends for the Modern Woman", date: "21 March 2024", excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.", tone: "#B98A5E" },
  { title: "Fashion Forward: Tips, Trends, and Inspiration", date: "21 March 2024", excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.", tone: "#8C6A4F" },
  { title: "Fall Fashion Frenzy: The Ultimate Style Guide", date: "21 March 2024", excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.", tone: "#A87447" },
];

export const FAQS = [
  { q: "How can I place an order?", a: "Browse the shop, add items to your cart, then proceed to checkout and choose your preferred payment method. You'll receive an order confirmation by email." },
  { q: "What payment methods do you accept?", a: "We accept PayPal, all major credit/debit cards, Google Pay and Cash on Delivery. All payments are processed over secure, encrypted connections." },
  { q: "Can I track my order after it's been placed?", a: "Yes — once your order ships you'll receive a tracking number via email. You can also track it from My Account → Track Your Order." },
  { q: "Do you offer customer support?", a: "Our support team is available 24x7 via phone and email. Reach us any time and we'll be happy to help." },
  { q: "What is your return policy?", a: "Items can be returned within 30 days of delivery in their original condition. Refunds are issued to the original payment method." },
  { q: "How to Create Account?", a: "Click the account icon in the header, choose Sign Up, and fill in your details. First-time customers get 25% off their first order." },
];

export const COLOR_SWATCHES: Record<string, string> = {
  Black: "#1F1B16",
  Grey: "#B9B7B2",
  Green: "#1E8E5A",
  Red: "#B0262D",
  Orange: "#D97A1F",
  Blue: "#2563EB",
  Pink: "#E08DA9",
  White: "#FFFFFF",
  Brown: "#6E3B2C",
  Cream: "#E9DCC3",
  "Light Brown": "#C9A87C",
  Gold: "#C9A24B",
};

export const FILTER_COLORS = ["Black", "Grey", "Green", "Red", "Orange", "Blue", "Pink", "White"];
export const FILTER_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];
export const FILTER_CATEGORIES = ["Men", "Women", "T-Shirts", "Handbags", "Jackets and Coats", "Watches", "Hat"];

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

/* ============================================================================
   PREMIUM / LUXURY STOREFRONT CONTENT
   ========================================================================== */

export const ANNOUNCEMENTS: { icon: string; text: string }[] = [
  { icon: "truck", text: "Complimentary shipping on orders above $180" },
  { icon: "sparkle", text: "Summer 2026 Collection is now live" },
  { icon: "clock", text: "Private Sale ends tonight — up to 40% off" },
  { icon: "shield", text: "Easy 7-day returns on every order" },
];

export interface MegaColumn {
  title: string;
  links: { label: string; href: string }[];
}
export interface MegaPreview {
  seed: string;
  label: string;
  caption: string;
  href: string;
}
export interface NavItem {
  label: string;
  href: string;
  columns?: MegaColumn[];
  preview?: MegaPreview;
}

export const MEGA_NAV: NavItem[] = [
  {
    label: "Women",
    href: "/shop?audience=Women",
    columns: [
      { title: "Clothing", links: [
        { label: "Dresses", href: "/shop?audience=Women" },
        { label: "Coats & Jackets", href: "/shop?audience=Women" },
        { label: "Knitwear", href: "/shop?audience=Women" },
        { label: "Shirts & Blouses", href: "/shop?audience=Women" },
      ]},
      { title: "Featured", links: [
        { label: "New In", href: "/shop" },
        { label: "Best Sellers", href: "/shop" },
        { label: "The Edit", href: "/shop" },
        { label: "Sale", href: "/shop" },
      ]},
    ],
    preview: { seed: "women-fashion-portrait", label: "The Tailored Edit", caption: "Soft structure for warmer days", href: "/shop?audience=Women" },
  },
  {
    label: "Men",
    href: "/shop?audience=Men",
    columns: [
      { title: "Clothing", links: [
        { label: "Shirts", href: "/shop?audience=Men" },
        { label: "Knitwear", href: "/shop?audience=Men" },
        { label: "Jackets & Coats", href: "/shop?audience=Men" },
        { label: "Suiting", href: "/shop?audience=Men" },
      ]},
      { title: "Featured", links: [
        { label: "New In", href: "/shop" },
        { label: "Essentials", href: "/shop" },
        { label: "Workwear", href: "/shop" },
        { label: "Sale", href: "/shop" },
      ]},
    ],
    preview: { seed: "men-fashion-portrait", label: "Modern Tailoring", caption: "Considered staples, elevated", href: "/shop?audience=Men" },
  },
  { label: "New Arrivals", href: "/shop" },
  { label: "Collections", href: "/shop" },
  { label: "Lookbook", href: "/#lookbook" },
  { label: "Sale", href: "/shop" },
];

export interface LookHotspot {
  x: number;
  y: number;
  productId: string;
  label: string;
}
export const SHOP_THE_LOOK: {
  seed: string;
  title: string;
  kicker: string;
  bundleDiscount: number;
  hotspots: LookHotspot[];
} = {
  seed: "editorial-full-outfit-model",
  kicker: "Shop The Look",
  title: "The Off-Duty Tailoring Story",
  bundleDiscount: 15,
  hotspots: [
    { x: 50, y: 20, productId: "classy-light-coat", label: "Coat" },
    { x: 46, y: 45, productId: "classic-white-shirt", label: "Shirt" },
    { x: 52, y: 70, productId: "modern-white-suit", label: "Trousers" },
    { x: 70, y: 40, productId: "leather-hand-bag", label: "Bag" },
    { x: 30, y: 55, productId: "classic-gold-watch", label: "Watch" },
  ],
};

export interface TrendingCard {
  tag: string;
  title: string;
  story: string;
  seed: string;
  href: string;
  size: "tall" | "wide" | "regular";
}
export const TRENDING_CARDS: TrendingCard[] = [
  { tag: "Best Seller", title: "The Camel Coat", story: "Our most-loved silhouette, returning in a softer wool blend.", seed: "camel-coat-editorial", href: "/shop", size: "tall" },
  { tag: "New Arrival", title: "Ivory Tailoring", story: "Clean lines and quiet confidence for the season ahead.", seed: "ivory-suit-editorial", href: "/shop", size: "regular" },
  { tag: "Limited Edition", title: "Gold Hour Accessories", story: "A small-batch capsule of watches and leather goods.", seed: "gold-accessories-editorial", href: "/shop?audience=Accessories", size: "regular" },
  { tag: "Editor's Choice", title: "The Evening Dress", story: "Designed to move — from dinner to the after-party.", seed: "evening-dress-editorial", href: "/shop?audience=Women", size: "wide" },
];

export const BRAND_STORY: { kicker: string; heading: string; intro: string; milestones: { year: string; title: string; text: string }[] } = {
  kicker: "Our House",
  heading: "Crafted with intention, worn with confidence",
  intro: "From a single atelier to a modern wardrobe house, every piece we make is built to last beyond a season.",
  milestones: [
    { year: "Our Beginning", title: "A single atelier", text: "Founded by a small team of makers obsessed with fit, fabric and the feeling a great garment gives you." },
    { year: "Craftsmanship", title: "Made to be kept", text: "We work with family-run mills and cut in limited runs, so each piece is finished by hands that care." },
    { year: "Sustainability", title: "Considered by design", text: "Natural fibres, low-impact dyes and packaging that gives back more than it takes." },
    { year: "Our Vision", title: "A wardrobe for life", text: "Fewer, better things — timeless design you'll reach for season after season." },
  ],
};

export interface LookbookFrame {
  seed: string;
  season: string;
  title: string;
  href: string;
}
export const LOOKBOOK: { kicker: string; heading: string; frames: LookbookFrame[] } = {
  kicker: "Lookbook",
  heading: "Summer 2026 — Designed for modern confidence",
  frames: [
    { seed: "lookbook-editorial-1", season: "Chapter 01", title: "Sun-Bleached Neutrals", href: "/shop" },
    { seed: "lookbook-editorial-2", season: "Chapter 02", title: "After Dark", href: "/shop" },
    { seed: "lookbook-editorial-3", season: "Chapter 03", title: "City Tailoring", href: "/shop" },
  ],
};

export interface SocialProofItem { seed: string; name: string; handle: string; rating: number; text: string }
export const SOCIAL_PROOF: SocialProofItem[] = [
  { seed: "ugc-customer-1", name: "Amara K.", handle: "@amara.styles", rating: 5, text: "The coat is even better in person — beautiful weight and finish." },
  { seed: "ugc-customer-2", name: "Daniel R.", handle: "@danielwears", rating: 5, text: "Perfect tailoring. Fits like it was made for me." },
  { seed: "ugc-customer-3", name: "Sofia L.", handle: "@sofia.edit", rating: 5, text: "Obsessed with the quality. Already ordering a second piece." },
  { seed: "ugc-customer-4", name: "Noah P.", handle: "@noah.daily", rating: 4, text: "Premium feel, fast shipping, and a lovely unboxing." },
];
