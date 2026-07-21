/**
 * Fashion Catalog seeding — populates the category tree (18 top-level
 * categories, ~145 subcategories) and 300+ realistic products with variants
 * (size × color × stock) and characteristics (material, fit, etc.).
 *
 * Idempotent: categories are matched by name (Category.name is globally
 * unique), and products are skipped if a product with the same name already
 * exists — safe to re-run without creating duplicates.
 *
 * Run with: npm run db:seed:catalog
 */
import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

import { CATEGORY_TREE } from './seeds/categoryTree';
import {
  AGE_GROUPS,
  BODY_TYPES,
  CATEGORY_PROFILES,
  COLORS,
  COUNTRIES_OF_ORIGIN,
  DRESS_CODES,
  FITS,
  MATERIALS,
  NECKLINES,
  PATTERNS,
  SLEEVE_TYPES,
  STYLE_AESTHETICS,
  WEATHER,
} from './seeds/attributes';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const pick = <T>(pool: T[], index: number): T => pool[index % pool.length];

const slugForImage = (name: string): string => encodeURIComponent(name);

const placeholderImage = (name: string): string =>
  `https://placehold.co/800x1000/EDEDED/6B7280?text=${slugForImage(name)}`;

let globalIndex = 0;

/** Builds one full product record (description, price, variants,
 *  characteristics, tags/labels/collections) from a base product name. */
function buildProduct(categoryName: string, subcategoryName: string, subcategoryId: string, baseName: string) {
  const profile = CATEGORY_PROFILES[categoryName];
  const i = globalIndex++;

  const primaryColor = pick(COLORS, i);
  const secondaryColor = pick(COLORS, i + 7); // offset so it's rarely the same as primary
  const material = pick(MATERIALS, i);
  const fit = pick(FITS, i);
  const pattern = pick(PATTERNS, i);
  const season = profile.defaultSeasons[i % profile.defaultSeasons.length];
  const weather = pick(WEATHER, i);
  const occasion = profile.defaultOccasions[i % profile.defaultOccasions.length];
  const dressCode = pick(DRESS_CODES, i);
  const style = pick(STYLE_AESTHETICS, i);
  const bodyType = pick(BODY_TYPES, i);
  const ageGroup = pick(AGE_GROUPS, i);
  const gender = profile.defaultGenders[i % profile.defaultGenders.length];
  const country = pick(COUNTRIES_OF_ORIGIN, i);

  const priceSpan = profile.priceMax - profile.priceMin;
  const basePrice = Math.round((profile.priceMin + (priceSpan * ((i * 37) % 100)) / 100) / 10) * 10;
  const onSale = i % 3 === 0;
  const discountPrice = onSale ? Math.round((basePrice * 0.8) / 10) * 10 : null;

  const description =
    `A ${fit.toLowerCase()} ${baseName.toLowerCase()} crafted from ${material.toLowerCase()}, featuring a ` +
    `${pattern.toLowerCase()} pattern in ${primaryColor.name.toLowerCase()}. Well suited for ${occasion.toLowerCase()} ` +
    `during ${season.toLowerCase() === 'all-season' ? 'any season' : season.toLowerCase()}, with a ${style.toLowerCase()} ` +
    `aesthetic that layers easily into a modern wardrobe.`;

  const shortDescription = `${fit} ${baseName} in ${primaryColor.name}`;

  const tags = [weather, dressCode, fit, pattern].filter(Boolean);
  const labels = [style, gender, ageGroup].filter(Boolean);
  const collections = [season, occasion].filter(Boolean);

  const characteristics: { name: string; value: string; position: number }[] = [
    { name: 'Material', value: material, position: 0 },
    { name: 'Fit Type', value: fit, position: 1 },
    { name: 'Pattern', value: pattern, position: 2 },
    { name: 'Body Type Compatibility', value: bodyType, position: 3 },
    { name: 'Country of Origin', value: country, position: 4 },
  ];
  if (profile.hasSleeveNeckline) {
    characteristics.push({ name: 'Sleeve Type', value: pick(SLEEVE_TYPES, i), position: 5 });
    characteristics.push({ name: 'Neckline', value: pick(NECKLINES, i), position: 6 });
  }

  const sizes = profile.sizes;
  // 2-3 sellable variants per product: a couple of sizes, alternating primary/secondary color.
  const variantSizes = sizes.length <= 2 ? sizes : [sizes[0], sizes[Math.floor(sizes.length / 2)], sizes[sizes.length - 1]];
  const variants = variantSizes.map((size, vi) => {
    const color = vi % 2 === 0 ? primaryColor : secondaryColor;
    return {
      size,
      color: color.name,
      sku: `${subcategoryName.slice(0, 3).toUpperCase()}-${i}-${vi}`.replace(/\s+/g, ''),
      price: new Prisma.Decimal(basePrice),
      discountPrice: discountPrice !== null ? new Prisma.Decimal(discountPrice) : null,
      stock: 15 + ((i + vi * 5) % 60),
      lowStockThreshold: 5,
      isActive: true,
    };
  });

  return {
    name: baseName,
    description,
    shortDescription,
    imageUrl: placeholderImage(baseName),
    imagePublicId: null,
    basePrice: new Prisma.Decimal(basePrice),
    discountPrice: discountPrice !== null ? new Prisma.Decimal(discountPrice) : null,
    currency: 'NPR',
    categoryId: subcategoryId,
    brand: 'NDH Trendgrid',
    status: 'PUBLISHED' as const,
    isActive: true,
    isFeatured: i % 11 === 0,
    isRecommended: i % 5 === 0,
    isTrending: i % 9 === 0,
    isBestSeller: i % 13 === 0,
    isNewArrival: i % 4 === 0,
    sizes,
    colors: [primaryColor, secondaryColor],
    tags,
    labels,
    collections,
    characteristics: { create: characteristics },
    variants: { create: variants },
  };
}

async function seedCategories(): Promise<Map<string, string>> {
  const subcategoryIds = new Map<string, string>(); // subcategory name -> id

  for (const category of CATEGORY_TREE) {
    let parent = await prisma.category.findFirst({ where: { name: category.name } });
    if (!parent) {
      parent = await prisma.category.create({
        data: { name: category.name, isActive: true, isFeatured: false },
      });
      console.log(`  + category "${category.name}"`);
    }

    for (const sub of category.subcategories) {
      let child = await prisma.category.findFirst({ where: { name: sub.name } });
      if (!child) {
        child = await prisma.category.create({
          data: { name: sub.name, parentCategoryId: parent.id, isActive: true, isFeatured: false },
        });
        console.log(`    + subcategory "${sub.name}" (under ${category.name})`);
      } else if (child.parentCategoryId !== parent.id) {
        // A category with this exact name already existed (e.g. from unrelated
        // earlier test data) and was reused rather than duplicated — but it
        // wasn't parented under the category the taxonomy expects. Re-parent
        // it rather than leaving it orphaned/mis-nested.
        child = await prisma.category.update({ where: { id: child.id }, data: { parentCategoryId: parent.id } });
        console.log(`    ~ re-parented existing category "${sub.name}" under ${category.name}`);
      }
      subcategoryIds.set(sub.name, child.id);
    }
  }

  return subcategoryIds;
}

async function seedProducts(subcategoryIds: Map<string, string>): Promise<{ created: number; skipped: number }> {
  const existingNames = new Set(
    (await prisma.product.findMany({ select: { name: true } })).map((p) => p.name.toLowerCase()),
  );

  let created = 0;
  let skipped = 0;

  for (const category of CATEGORY_TREE) {
    for (const sub of category.subcategories) {
      const subcategoryId = subcategoryIds.get(sub.name);
      if (!subcategoryId) continue; // should never happen — seedCategories runs first

      for (const baseName of sub.products) {
        if (existingNames.has(baseName.toLowerCase())) {
          skipped++;
          continue;
        }

        const data = buildProduct(category.name, sub.name, subcategoryId, baseName);
        // eslint-disable-next-line no-await-in-loop
        await prisma.product.create({ data });
        existingNames.add(baseName.toLowerCase());
        created++;
      }
    }
  }

  return { created, skipped };
}

async function main(): Promise<void> {
  console.log('Seeding category tree...');
  const subcategoryIds = await seedCategories();
  console.log(`Category tree ready: ${subcategoryIds.size} subcategories mapped.`);

  console.log('Seeding products...');
  const { created, skipped } = await seedProducts(subcategoryIds);
  console.log(`Products: ${created} created, ${skipped} skipped (already existed).`);

  const totals = await prisma.product.count();
  console.log(`Catalog now has ${totals} products total.`);
}

main()
  .catch((err) => {
    console.error('Catalog seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
