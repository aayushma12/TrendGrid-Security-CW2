import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// NOTE: placeholder hash. Hash real passwords with bcrypt before production.
const PLACEHOLDER_HASH = "$2a$12$placeholderplaceholderplaceholderplaceholde";

const SAMPLE_PRODUCTS = [
  { title: "Signature Tee", price: 29, compareAt: 39, img: "https://placehold.co/800x800/6366F1/FFFFFF?text=Tee" },
  { title: "Merino Crew Sweater", price: 89, compareAt: null, img: "https://placehold.co/800x800/0F172A/FFFFFF?text=Sweater" },
  { title: "Classic Denim Jacket", price: 120, compareAt: 150, img: "https://placehold.co/800x800/1E3A8A/FFFFFF?text=Jacket" },
  { title: "Everyday Tote", price: 45, compareAt: null, img: "https://placehold.co/800x800/F59E0B/FFFFFF?text=Tote" },
  { title: "Linen Shirt", price: 65, compareAt: 80, img: "https://placehold.co/800x800/10B981/FFFFFF?text=Shirt" },
  { title: "Wool Beanie", price: 24, compareAt: null, img: "https://placehold.co/800x800/EC4899/FFFFFF?text=Beanie" },
  { title: "Leather Belt", price: 38, compareAt: null, img: "https://placehold.co/800x800/7C2D12/FFFFFF?text=Belt" },
  { title: "Canvas Sneakers", price: 75, compareAt: 95, img: "https://placehold.co/800x800/334155/FFFFFF?text=Sneakers" },
];

const CUSTOMERS = [
  { first: "Alex", last: "Parker", city: "Austin", state: "TX" },
  { first: "Jordan", last: "Mills", city: "Denver", state: "CO" },
  { first: "Sam", last: "Reed", city: "Seattle", state: "WA" },
];

const ORDER_STATUS = ["delivered", "shipped", "processing", "pending", "cancelled"] as const;
const PAY_STATUS = ["paid", "paid", "paid", "pending", "refunded"] as const;
const FULFILL = ["fulfilled", "fulfilled", "unfulfilled", "unfulfilled", "unfulfilled"] as const;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function seedTenant(opts: {
  name: string;
  slug: string;
  subdomain: string;
  primaryColor: string;
  accentColor: string;
}) {
  const tenant = await prisma.tenant.create({
    data: { name: opts.name, slug: opts.slug, subdomain: opts.subdomain, status: "active", settings: {}, featureFlags: {} },
  });

  await prisma.storeSettings.create({
    data: {
      tenantId: tenant.id,
      storeName: opts.name,
      storeEmail: `hello@${opts.slug}.example.com`,
      storePhone: "+1 (555) 010-0100",
      currency: "USD",
      timezone: "America/New_York",
      language: "en",
      orderPrefix: "ORD-",
      socialLinks: { instagram: `https://instagram.com/${opts.slug}`, twitter: `https://x.com/${opts.slug}` },
    },
  });

  await prisma.theme.create({
    data: { tenantId: tenant.id, name: "Default", isActive: true, isDefault: true, colorPrimary: opts.primaryColor, colorAccent: opts.accentColor },
  });

  const adminRole = await prisma.role.create({
    data: { tenantId: tenant.id, name: "Owner", isSystem: true, permissions: { all: true } },
  });
  const staffRole = await prisma.role.create({
    data: { tenantId: tenant.id, name: "Staff", isSystem: true, permissions: { orders: true, products: true } },
  });
  const owner = await prisma.user.create({
    data: { tenantId: tenant.id, email: `admin@${opts.slug}.example.com`, passwordHash: PLACEHOLDER_HASH, firstName: "Store", lastName: "Owner", status: "active" },
  });
  await prisma.userRole.create({ data: { userId: owner.id, roleId: adminRole.id } });
  void staffRole;

  const category = await prisma.category.create({ data: { tenantId: tenant.id, name: "Apparel", slug: "apparel", isVisible: true } });
  const accessories = await prisma.category.create({ data: { tenantId: tenant.id, name: "Accessories", slug: "accessories", isVisible: true } });
  const brand = await prisma.brand.create({ data: { tenantId: tenant.id, name: opts.name, slug: opts.slug } });

  // Products (capture created rows for orders)
  const created: { id: string; title: string; variantId: string; price: number; img: string }[] = [];
  for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
    const p = SAMPLE_PRODUCTS[i];
    const prod = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        title: p.title,
        slug: slugify(p.title),
        shortDescription: "A thoughtfully made everyday essential.",
        description: "Crafted from premium materials for lasting comfort.",
        status: "active",
        type: "physical",
        categoryId: i % 3 === 0 ? accessories.id : category.id,
        brandId: brand.id,
        publishedAt: new Date(),
        featuredAt: i < 4 ? new Date() : null,
        variants: { create: [{ tenantId: tenant.id, sku: `${opts.slug.toUpperCase()}-${i + 1}`, price: p.price, compareAtPrice: p.compareAt ?? null, currency: "USD", inventoryQuantity: 100 - i * 7, isDefault: true }] },
        images: { create: [{ tenantId: tenant.id, url: p.img, altText: p.title, isPrimary: true }] },
      },
      include: { variants: true },
    });
    created.push({ id: prod.id, title: prod.title, variantId: prod.variants[0].id, price: p.price, img: p.img });
  }

  // Media records
  for (const p of created.slice(0, 4)) {
    await prisma.media.create({
      data: { tenantId: tenant.id, uploadedBy: owner.id, filename: `${slugify(p.title)}.jpg`, originalName: `${p.title}.jpg`, mimeType: "image/jpeg", size: 240000, url: p.img, thumbnailUrl: p.img, width: 800, height: 800, altText: p.title },
    });
  }

  // Coupon
  await prisma.coupon.create({
    data: { tenantId: tenant.id, code: "WELCOME10", type: "percentage", value: 10, minOrderAmount: 30, usageLimit: 1000, isActive: true, startsAt: new Date() },
  });

  // Customers + orders
  let firstCustomerUserId: string | null = null;
  for (let c = 0; c < CUSTOMERS.length; c++) {
    const cu = CUSTOMERS[c];
    const custUser = await prisma.user.create({
      data: { tenantId: tenant.id, email: `${cu.first.toLowerCase()}@example.com`, passwordHash: PLACEHOLDER_HASH, firstName: cu.first, lastName: cu.last, status: "active" },
    });
    if (c === 0) firstCustomerUserId = custUser.id;

    // Each customer gets 1-2 orders
    const orderCount = c === 0 ? 2 : 1;
    let spent = 0;
    let firstOrderAt: Date | null = null;
    let lastOrderAt: Date | null = null;

    for (let o = 0; o < orderCount; o++) {
      const idx = (c + o) % ORDER_STATUS.length;
      const items = created.slice(o, o + 2 + c).slice(0, 2);
      const subtotal = items.reduce((s, it) => s + it.price, 0);
      const shipping = subtotal > 50 ? 0 : 7;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = subtotal + shipping + tax;
      const placedAt = new Date(Date.now() - (c * 5 + o) * 86400000);
      if (!firstOrderAt) firstOrderAt = placedAt;
      lastOrderAt = placedAt;
      const status = ORDER_STATUS[idx];
      if (status !== "cancelled" && PAY_STATUS[idx] !== "refunded") spent += total;

      const order = await prisma.order.create({
        data: {
          tenantId: tenant.id,
          userId: custUser.id,
          orderNumber: `ORD-${1000 + c * 10 + o}`,
          status,
          paymentStatus: PAY_STATUS[idx],
          fulfillmentStatus: FULFILL[idx],
          currency: "USD",
          subtotal, discountAmount: 0, taxAmount: tax, shippingAmount: shipping, total,
          createdAt: placedAt,
          items: {
            create: items.map((it) => ({
              tenantId: tenant.id, productId: it.id, variantId: it.variantId,
              title: it.title, quantity: 1, price: it.price, totalPrice: it.price, imageUrl: it.img,
            })),
          },
          addresses: {
            create: [{
              tenantId: tenant.id, type: "shipping", firstName: cu.first, lastName: cu.last,
              line1: "123 Market St", city: cu.city, state: cu.state, zip: "00000", country: "US",
            }],
          },
        },
      });
      await prisma.payment.create({
        data: {
          tenantId: tenant.id, orderId: order.id, gateway: "stripe", amount: total, currency: "USD",
          status: PAY_STATUS[idx], method: "card", brand: "visa", last4: "4242",
        },
      });
    }

    await prisma.customer.create({
      data: {
        tenantId: tenant.id, userId: custUser.id, totalOrders: orderCount, totalSpent: spent,
        averageOrderValue: orderCount ? Math.round((spent / orderCount) * 100) / 100 : 0,
        firstOrderAt, lastOrderAt, marketingOptIn: c % 2 === 0, lifetimeValue: spent,
      },
    });
  }

  // Wishlist for the first customer
  if (firstCustomerUserId) {
    await prisma.wishlist.create({
      data: {
        tenantId: tenant.id,
        userId: firstCustomerUserId,
        name: "My Wishlist",
        items: created.slice(0, 3).map((p) => ({ productId: p.id, title: p.title, image: p.img, price: p.price, slug: slugify(p.title) })),
      },
    });
  }

  // Pages: Home (rich), Shop, About
  await prisma.page.create({
    data: {
      tenantId: tenant.id, title: "Home", slug: "home", type: "home", status: "published", publishedAt: new Date(),
      sections: {
        create: [
          { tenantId: tenant.id, type: "hero_banner", order: 0, settingsJson: { heading: `Welcome to ${opts.name}`, subtext: "Discover our latest collection of everyday essentials.", ctaText: "Shop the collection", ctaLink: "?page=shop", pattern: { patternType: "meshGradient" } } },
          { tenantId: tenant.id, type: "trust_badges", order: 1, settingsJson: { badges: [{ title: "Free shipping over $50", icon: "🚚" }, { title: "30-day returns", icon: "↩" }, { title: "Secure checkout", icon: "🔒" }, { title: "24/7 support", icon: "💬" }] } },
          { tenantId: tenant.id, type: "product_grid", order: 2, settingsJson: { heading: "Featured", subtext: "Hand-picked favourites", limit: 8 } },
          { tenantId: tenant.id, type: "banner_cta", order: 3, settingsJson: { heading: "Members save 10%", subtext: "Join our list for early access to drops.", ctaText: "Sign up", ctaLink: "#newsletter", pattern: { patternType: "linearGradient" } } },
          { tenantId: tenant.id, type: "testimonials_grid", order: 4, settingsJson: { heading: "What customers say", items: [{ quote: "Best quality I've found online.", author: "Alex P." }, { quote: "Fast shipping and beautiful packaging.", author: "Jordan M." }, { quote: "My new favourite store.", author: "Sam R." }] } },
          { tenantId: tenant.id, type: "newsletter_signup", order: 5, anchorId: "newsletter", settingsJson: { heading: "Join our newsletter", subtext: "Get the latest drops and offers.", ctaText: "Subscribe", pattern: { patternType: "dotGrid" } } },
        ],
      },
    },
  });
  await prisma.page.create({
    data: {
      tenantId: tenant.id, title: "Shop", slug: "shop", type: "shop", status: "published", publishedAt: new Date(),
      sections: { create: [
        { tenantId: tenant.id, type: "banner_text", order: 0, settingsJson: { heading: "Shop all", subtext: "Everything we make, in one place." } },
        { tenantId: tenant.id, type: "product_grid", order: 1, settingsJson: { heading: "", limit: 12 } },
      ] },
    },
  });
  await prisma.page.create({
    data: {
      tenantId: tenant.id, title: "About", slug: "about", type: "about", status: "published", publishedAt: new Date(),
      sections: { create: [
        { tenantId: tenant.id, type: "image_text_split", order: 0, settingsJson: { heading: "Our story", body: "We craft thoughtful essentials built to last.", image: "https://placehold.co/700x500/6366F1/FFFFFF?text=About" } },
        { tenantId: tenant.id, type: "stats_counter", order: 1, settingsJson: { stats: [{ value: "50k+", label: "Happy customers" }, { value: "120", label: "Products" }, { value: "30", label: "Countries" }] } },
        { tenantId: tenant.id, type: "faq_accordion", order: 2, settingsJson: { heading: "FAQ", items: [{ q: "Do you ship internationally?", a: "Yes, to 30+ countries." }, { q: "What is your return policy?", a: "30-day free returns." }] } },
      ] },
    },
  });

  console.log(`Seeded ${tenant.name}: ${created.length} products, ${CUSTOMERS.length} customers, orders, media, coupon, 3 pages`);
}

async function main() {
  console.log("Seeding database...");
  await seedTenant({ name: "TrendGrid Demo", slug: "trendgrid", subdomain: "trendgrid", primaryColor: "#6366F1", accentColor: "#F59E0B" });
  await seedTenant({ name: "Aurora Boutique", slug: "aurora", subdomain: "aurora", primaryColor: "#10B981", accentColor: "#EC4899" });
  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
