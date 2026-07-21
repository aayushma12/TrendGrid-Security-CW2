/**
 * Seeds the 7 admin-curated merchandising collections requested for the
 * storefront (Men, Women, Kids, New Arrivals, Best Sellers, Summer
 * Collection, Winter Collection) and populates each one's product
 * membership by matching the EXISTING seed-generated product attributes
 * (labels/collections arrays, isBestSeller/isNewArrival flags) — no new
 * per-product tagging, per the "reuse existing data" approach used for the
 * rest of the catalog.
 *
 * Idempotent: collections are matched by name (Collection.name is unique),
 * and membership is a plain connect (Prisma dedupes automatically), so this
 * script is safe to re-run at any time — e.g. after seeding more products.
 *
 * "Kids" has no naturally-matching seed attribute (the catalog only
 * generates Women/Men/Unisex labels), so it's created empty and left for
 * an admin to populate manually — better than fabricating fake matches.
 *
 * Run with: npm run db:seed:collections
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

interface CollectionDef {
  name: string;
  description: string;
  displayOrder: number;
  /** Returns the ids of products that belong in this collection. */
  matchProductIds: () => Promise<string[]>;
}

const byLabel = (label: string) => async (): Promise<string[]> => {
  const rows = await prisma.product.findMany({ where: { labels: { has: label } }, select: { id: true } });
  return rows.map((r) => r.id);
};

const bySeasonCollection = (season: string) => async (): Promise<string[]> => {
  const rows = await prisma.product.findMany({ where: { collections: { has: season } }, select: { id: true } });
  return rows.map((r) => r.id);
};

const byFlag = (flag: 'isBestSeller' | 'isNewArrival') => async (): Promise<string[]> => {
  const rows = await prisma.product.findMany({ where: { [flag]: true }, select: { id: true } });
  return rows.map((r) => r.id);
};

const COLLECTIONS: CollectionDef[] = [
  { name: 'Men', description: "Everything from our men's range.", displayOrder: 1, matchProductIds: byLabel('Men') },
  { name: 'Women', description: "Everything from our women's range.", displayOrder: 2, matchProductIds: byLabel('Women') },
  { name: 'Kids', description: 'Fashion for kids.', displayOrder: 3, matchProductIds: async () => [] },
  { name: 'New Arrivals', description: 'The latest additions to the catalog.', displayOrder: 4, matchProductIds: byFlag('isNewArrival') },
  { name: 'Best Sellers', description: 'Our most popular products.', displayOrder: 5, matchProductIds: byFlag('isBestSeller') },
  { name: 'Summer Collection', description: 'Warm-weather essentials.', displayOrder: 6, matchProductIds: bySeasonCollection('Summer') },
  { name: 'Winter Collection', description: 'Cold-weather essentials.', displayOrder: 7, matchProductIds: bySeasonCollection('Winter') },
];

async function main(): Promise<void> {
  for (const def of COLLECTIONS) {
    let collection = await prisma.collection.findFirst({ where: { name: def.name } });
    if (!collection) {
      collection = await prisma.collection.create({
        data: { name: def.name, description: def.description, displayOrder: def.displayOrder, isActive: true },
      });
      console.log(`+ collection "${def.name}"`);
    }

    // eslint-disable-next-line no-await-in-loop
    const productIds = await def.matchProductIds();
    if (productIds.length) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.collection.update({
        where: { id: collection.id },
        data: { products: { connect: productIds.map((id) => ({ id })) } },
      });
    }
    console.log(`  matched ${productIds.length} products for "${def.name}"`);
  }

  const totals = await prisma.collection.count();
  console.log(`Collections ready: ${totals} total.`);
}

main()
  .catch((err) => {
    console.error('Collection seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
