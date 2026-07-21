/**
 * Wipes catalog / commerce / content data — categories, products (+ variants,
 * characteristics, images), banners, coupons, homepage sections, reviews,
 * carts, wishlists, and orders.
 *
 * Deliberately leaves `users`, `refresh_tokens`, and `password_history`
 * untouched, so your admin login (and any registered customer accounts)
 * keeps working after this runs.
 *
 * This is DESTRUCTIVE and CANNOT be undone. It requires an explicit --yes
 * flag so it can never run by accident (e.g. via a copy-pasted npm command).
 *
 * Usage:
 *   npx ts-node prisma/wipe-seeded-data.ts --yes
 *   (or: npm run db:wipe -- --yes)
 *
 * After running, `npx prisma db seed` will recreate the 13 default homepage
 * sections and the admin@trendgrid.com user (seed.ts is idempotent — it only
 * creates rows that don't already exist, e.g. it will skip re-creating the
 * admin user since that row is untouched by this script).
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Order doesn't matter within one TRUNCATE call — Postgres truncates all
// listed tables atomically. CASCADE is a safety net in case a table here
// is referenced by something not listed (there shouldn't be any, given the
// current schema, but it keeps this from ever failing on a stray FK).
const TABLES_TO_WIPE = [
  'order_status_history',
  'order_items',
  'orders',
  'coupon_usages',
  'coupons',
  'review_images',
  'reviews',
  'wishlist_items',
  'wishlists',
  'cart_items',
  'carts',
  'product_variant_images',
  'product_variants',
  'product_characteristics',
  'products',
  'categories',
  'banners',
  'homepage_sections',
];

async function main(): Promise<void> {
  const confirmed = process.argv.includes('--yes');
  if (!confirmed) {
    console.error(
      '\nRefusing to run without --yes.\n' +
        'This permanently deletes ALL rows in:\n  ' +
        TABLES_TO_WIPE.join(', ') +
        '\n\nusers / refresh_tokens / password_history are NOT touched.\n\n' +
        'Re-run as:\n  npx ts-node prisma/wipe-seeded-data.ts --yes\n',
    );
    process.exit(1);
  }

  console.log(`Truncating ${TABLES_TO_WIPE.length} tables...`);
  const identifiers = TABLES_TO_WIPE.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${identifiers} CASCADE;`);
  console.log('Done. users / refresh_tokens / password_history were left untouched.');
  console.log('Run `npx prisma db seed` if you want the 13 default homepage sections back.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
