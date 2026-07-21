import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seedAdminUser(): Promise<void> {
  const adminEmail = 'admin@trendgrid.com';
  const adminPassword = 'Admin123!';

  console.log(`Seeding database... Checking for existing user: ${adminEmail}`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`User ${adminEmail} already exists. Skipping creation.`);
  } else {
    // We should use the same saltRounds as the service, but since we are running a script,
    // we can default to 10 if env is missing.
    const saltRounds = process.env.JWT_SALT_ROUNDS ? parseInt(process.env.JWT_SALT_ROUNDS, 10) : 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Admin',
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`Successfully created admin user: ${adminEmail}`);
  }
}

/* ===================================================================== */
/* Homepage CMS — 13 default sections mirroring the storefront's Nexa*    */
/* component tree. Idempotent: only creates sections whose `key` doesn't  */
/* already exist, so re-running never clobbers admin edits.               */
/* ===================================================================== */

type FieldType = 'text' | 'textarea' | 'image';
interface Field { key: string; label: string; type: FieldType; value: string }
interface RepeaterFieldDef { key: string; label: string; type: FieldType }
interface Repeater {
  key: string;
  label: string;
  itemNoun: string;
  itemFields: RepeaterFieldDef[];
  items: Record<string, string>[];
}
interface SectionContent { note?: string; fields: Field[]; repeaters: Repeater[] }
interface SectionSeed {
  key: string;
  name: string;
  description: string;
  content: SectionContent;
}

const t = (key: string, label: string, value: string): Field => ({ key, label, type: 'text', value });
const area = (key: string, label: string, value: string): Field => ({ key, label, type: 'textarea', value });
const img = (key: string, label: string, value: string): Field => ({ key, label, type: 'image', value });

const HOMEPAGE_SECTIONS: SectionSeed[] = [
  {
    key: 'sec_header',
    name: 'Header / Navbar',
    description: 'Top navigation, logo and cart',
    content: {
      note: 'The announcement bar is managed in Banners; navigation targets in Settings.',
      fields: [t('brand', 'Brand name', 'TrendGrid')],
      repeaters: [
        {
          key: 'nav',
          label: 'Navigation links',
          itemNoun: 'link',
          itemFields: [t('label', 'Label', ''), t('href', 'URL', '')],
          items: [
            { label: 'Home', href: '/' },
            { label: 'Collections', href: '/shop' },
            { label: 'Brand', href: '/shop' },
            { label: 'Contact', href: '/contact' },
          ],
        },
      ],
    },
  },
  {
    key: 'sec_hero',
    name: 'Hero',
    description: 'Masked word-stagger hero banner',
    content: {
      fields: [
        t('eyebrow', 'Eyebrow', 'New Season Collection 2026'),
        t('titleLine1', 'Title line 1', 'Elevate Your'),
        t('titleLine2', 'Title line 2', 'Signature'),
        t('titleAccent', 'Title accent word', 'Style'),
        area('copy', 'Body copy', 'Explore modern fashion with carefully selected styles designed for every moment and lifestyle — premium fabrics, timeless cuts, zero compromise.'),
        t('ctaPrimary', 'Primary button', 'Explore Collection'),
        t('ctaSecondary', 'Secondary button', 'Browse Categories'),
        img('image', 'Hero image', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=880&h=1100&fit=crop&crop=faces,center&auto=format&q=75'),
      ],
      repeaters: [
        {
          key: 'stats',
          label: 'Proof stats',
          itemNoun: 'stat',
          itemFields: [t('value', 'Value', ''), t('label', 'Label', '')],
          items: [
            { value: '25K+', label: 'Happy Shoppers' },
            { value: '9.5/10', label: 'Avg. Rating' },
          ],
        },
      ],
    },
  },
  {
    key: 'sec_marquee',
    name: 'Marquee Strip',
    description: 'Scrolling announcement strip',
    content: {
      fields: [],
      repeaters: [
        {
          key: 'items',
          label: 'Marquee items',
          itemNoun: 'item',
          itemFields: [t('text', 'Text', '')],
          items: ['Streetwear', 'Classic Formal', 'Everyday Essentials', 'Sports & Active', 'Modern Bottoms', 'Premium Outerwear'].map((x) => ({ text: x })),
        },
      ],
    },
  },
  {
    key: 'sec_categories',
    name: 'Categories',
    description: 'Tabbed category product grid',
    content: {
      note: 'Category tiles are managed in Categories — this edits the section heading only.',
      fields: [
        t('heading', 'Heading', 'Shape Your Signature Style'),
        area('subtext', 'Subtext', 'Browse fashion categories and explore outfits that match your personality.'),
      ],
      repeaters: [],
    },
  },
  {
    key: 'sec_arrivals',
    name: 'New Arrivals',
    description: 'Horizontal snap-scroll rail',
    content: {
      note: 'Products come from Products — this edits the section heading only.',
      fields: [
        t('heading', 'Heading', 'New Arrivals'),
        area('subtext', 'Subtext', 'Fresh drops — scroll sideways to browse.'),
      ],
      repeaters: [],
    },
  },
  {
    key: 'sec_about',
    name: 'About / Brand Story',
    description: 'Brand narrative with milestones',
    content: {
      fields: [
        t('eyebrow', 'Eyebrow', 'About us'),
        t('ctaText', 'Button text', 'Learn More About Us'),
        area('heading', 'Heading', 'Where Timeless Heritage Meets Refined Modern Craftsmanship'),
        img('image1', 'Photo 1', 'street style jacket city'),
        img('image2', 'Photo 2', 'tailored coat fitting boutique'),
      ],
      repeaters: [
        {
          key: 'stats',
          label: 'Stats',
          itemNoun: 'stat',
          itemFields: [t('value', 'Value', ''), t('label', 'Label', '')],
          items: [
            { value: '245K', label: 'Style Inspired Users' },
            { value: '9.5/10', label: 'Customer Satisfaction' },
          ],
        },
      ],
    },
  },
  {
    key: 'sec_lookbook',
    name: 'Lookbook',
    description: 'Editorial season lookbook',
    content: {
      fields: [
        t('kicker', 'Kicker', 'Lookbook'),
        area('heading', 'Heading', 'Summer 2026 — Designed for modern confidence'),
      ],
      repeaters: [
        {
          key: 'frames',
          label: 'Lookbook frames',
          itemNoun: 'frame',
          itemFields: [t('season', 'Chapter', ''), t('title', 'Title', ''), img('seed', 'Image', '')],
          items: [
            { season: 'Chapter 01', title: 'Sun-Bleached Neutrals', seed: 'lookbook-editorial-1' },
            { season: 'Chapter 02', title: 'After Dark', seed: 'lookbook-editorial-2' },
            { season: 'Chapter 03', title: 'City Tailoring', seed: 'lookbook-editorial-3' },
          ],
        },
      ],
    },
  },
  {
    key: 'sec_brands',
    name: 'Brand Logos',
    description: 'Partner / brand logo strip',
    content: {
      fields: [t('label', 'Label', 'As featured in')],
      repeaters: [
        {
          key: 'brands',
          label: 'Brand names',
          itemNoun: 'brand',
          itemFields: [t('name', 'Name', '')],
          items: ['VOGUE', 'GQ', 'ESQUIRE', 'HYPEBEAST', 'COMPLEX', 'HIGHSNOBIETY'].map((x) => ({ name: x })),
        },
      ],
    },
  },
  {
    key: 'sec_testimonials',
    name: 'Testimonials',
    description: 'Customer reviews carousel',
    content: {
      fields: [
        t('heading', 'Heading', 'Smarter Fashion Starts Here'),
        area('subtext', 'Subtext', 'See why modern shoppers trust our premium fashion experience and everyday style collections.'),
      ],
      repeaters: [
        {
          key: 'quotes',
          label: 'Testimonials',
          itemNoun: 'testimonial',
          itemFields: [t('name', 'Name', ''), area('text', 'Quote', ''), img('seed', 'Avatar', '')],
          items: [
            { name: 'Daniel Carter', text: 'The clean stitching and premium fit make every outfit feel stylish and comfortable all day.', seed: 'men avatar daniel shirt' },
            { name: 'Ryan Mitchell', text: 'Excellent fabric quality with a modern look that instantly upgrades my wardrobe.', seed: 'men avatar ryan coat' },
            { name: 'Ethan Walker', text: 'Minimal, classy, and incredibly comfortable — exactly what I look for in fashion.', seed: 'men avatar ethan suit' },
            { name: 'Lucas Bennett', text: 'The details, fit, and overall design feel premium and worth every penny.', seed: 'men avatar lucas sweater' },
          ],
        },
      ],
    },
  },
  {
    key: 'sec_cta',
    name: 'Call to Action',
    description: 'Newsletter / promo CTA band',
    content: {
      fields: [
        t('eyebrow', 'Eyebrow', 'Limited Offer'),
        t('title', 'Title', 'Get 25% Off Your First Order'),
        area('copy', 'Copy', 'Join 25K+ members and unlock early access to drops, styling tips, and member-only pricing.'),
        t('ctaPrimary', 'Primary button', 'Claim the Offer'),
        t('ctaSecondary', 'Secondary button', 'Talk to a Stylist'),
      ],
      repeaters: [],
    },
  },
  {
    key: 'sec_faq',
    name: 'FAQ',
    description: 'Accordion of common questions',
    content: {
      fields: [t('heading', 'Heading', 'Frequently asked questions')],
      repeaters: [
        {
          key: 'items',
          label: 'Questions',
          itemNoun: 'question',
          itemFields: [t('q', 'Question', ''), area('a', 'Answer', '')],
          items: [
            { q: 'How can I place an order?', a: 'Browse the shop, add items to your cart, then proceed to checkout and choose your preferred payment method.' },
            { q: 'What payment methods do you accept?', a: 'We accept PayPal, all major credit/debit cards, Google Pay and Cash on Delivery.' },
            { q: "Can I track my order after it's been placed?", a: "Yes — once your order ships you'll receive a tracking number via email." },
            { q: 'What is your return policy?', a: 'Items can be returned within 30 days of delivery in their original condition.' },
          ],
        },
      ],
    },
  },
  {
    key: 'sec_features',
    name: 'Features / Trust',
    description: 'Shipping, payment, support badges',
    content: {
      fields: [t('heading', 'Heading (screen-reader)', 'Why shop with us')],
      repeaters: [
        {
          key: 'items',
          label: 'Feature cards',
          itemNoun: 'feature',
          itemFields: [t('title', 'Title', ''), area('text', 'Text', '')],
          items: [
            { title: 'Free Shipping', text: 'On every order over $180, delivered fast.' },
            { title: 'Easy 30-Day Returns', text: 'Changed your mind? Send it back free within 30 days.' },
            { title: 'Secure Checkout', text: 'Encrypted payments with cards, wallets, and COD.' },
            { title: 'Human Support', text: 'Real stylists on (406) 555-0120, Mon–Sat.' },
          ],
        },
      ],
    },
  },
  {
    key: 'sec_footer',
    name: 'Footer',
    description: 'Links, contact and socials',
    content: {
      fields: [
        t('brand', 'Brand name', 'TrendGrid'),
        area('tagline', 'Tagline', "Fewer, better things — timeless design you'll reach for season after season."),
        t('email', 'Email', 'example@gmail.com'),
        t('phone', 'Phone', '+0123-456-789'),
        t('address', 'Address', '8502 Preston Rd. Inglewood, Maine 98380'),
        t('copyright', 'Copyright', '© 2026 TrendGrid. All rights reserved.'),
      ],
      repeaters: [
        {
          key: 'links',
          label: 'Footer links',
          itemNoun: 'link',
          itemFields: [t('label', 'Label', ''), t('href', 'URL', '')],
          items: [
            { label: 'Shop', href: '/shop' },
            { label: 'About', href: '/shop' },
            { label: 'Contact', href: '/contact' },
            { label: 'FAQ', href: '/#faq' },
          ],
        },
      ],
    },
  },
];

async function seedHomepageSections(): Promise<void> {
  console.log('Seeding homepage sections...');
  for (const [index, section] of HOMEPAGE_SECTIONS.entries()) {
    const existing = await prisma.homepageSection.findUnique({ where: { key: section.key } });
    if (existing) {
      console.log(`- skip (exists): ${section.key}`);
      continue;
    }
    await prisma.homepageSection.create({
      data: {
        key: section.key,
        name: section.name,
        description: section.description,
        visible: true,
        sortOrder: index,
        content: section.content as unknown as Prisma.InputJsonValue,
      },
    });
    console.log(`+ created: ${section.key}`);
  }
}

async function main(): Promise<void> {
  await seedAdminUser();
  await seedHomepageSections();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
