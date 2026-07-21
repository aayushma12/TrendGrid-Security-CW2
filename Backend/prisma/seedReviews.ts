/**
 * Review & rating seeding — gives every product 3-8 realistic customer
 * reviews with a positive-skewed rating distribution, templated (not
 * literally duplicated) titles/comments, a mix of verified-purchase and
 * unverified reviews, spread creation dates, and a handful of admin replies
 * and non-APPROVED statuses so the moderation queue has something in it.
 *
 * "Verified purchase" is represented the way the schema already models it —
 * Review.orderId pointing at a real Order (see PR: no new column added).
 * Average ratings are computed on the fly by the review repository
 * (`_avg` aggregate), so there's no separate summary field to backfill.
 *
 * Idempotent: skips entirely if any review already exists — re-run after
 * `db:wipe` or on a fresh database, not on top of itself.
 *
 * Run with: npm run db:seed:reviews
 */
import 'dotenv/config';
import crypto from 'crypto';

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

import { encryptJson } from '../src/utils/crypto';
import {
  RATING_WEIGHTS,
  REVIEWER_FIRST_NAMES,
  REVIEWER_LAST_NAMES,
  buildReviewText,
  pickAdminReply,
} from './seeds/reviewContent';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const REVIEWER_POOL_SIZE = 45;
const VERIFIED_PURCHASE_RATE = 0.65;
const BATCH_SIZE = 400;

// ---- deterministic PRNG (mulberry32) — reproducible across re-seeds, same
// spirit as seedCatalog.ts's index-based `pick`, but needs an actual
// distribution (rating weights, shuffles) rather than round-robin cycling. ----
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260721);

function weightedRating(): number {
  const total = RATING_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  for (const [rating, weight] of RATING_WEIGHTS) {
    if (roll < weight) return rating;
    roll -= weight;
  }
  return RATING_WEIGHTS[0][0];
}

function shuffledIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random past date, weighted toward more recent (reviews accumulate over
 *  time — a product that's been live longer naturally has older reviews too,
 *  but recent activity should dominate). */
function pastDate(maxDaysAgo: number): Date {
  const daysAgo = Math.floor(rand() * rand() * maxDaysAgo); // rand*rand skews toward 0 (recent)
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8 + Math.floor(rand() * 12), Math.floor(rand() * 60), 0, 0);
  return d;
}

async function ensureReviewerPool(): Promise<{ id: string }[]> {
  const existing = await prisma.user.findMany({
    where: { role: 'USER', isActive: true },
    select: { id: true },
  });

  if (existing.length >= REVIEWER_POOL_SIZE) return existing;

  const needed = REVIEWER_POOL_SIZE - existing.length;
  const passwordHash = await bcrypt.hash('SeedReviewer123!', 10);
  const toCreate: Prisma.UserCreateManyInput[] = [];
  for (let i = 0; i < needed; i += 1) {
    const first = REVIEWER_FIRST_NAMES[i % REVIEWER_FIRST_NAMES.length];
    const last = REVIEWER_LAST_NAMES[Math.floor(i / REVIEWER_FIRST_NAMES.length) % REVIEWER_LAST_NAMES.length];
    toCreate.push({
      id: crypto.randomUUID(),
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}.seed${i}@example.com`,
      passwordHash,
      role: 'USER',
      isActive: true,
    });
  }
  await prisma.user.createMany({ data: toCreate, skipDuplicates: true });

  return prisma.user.findMany({ where: { role: 'USER', isActive: true }, select: { id: true } });
}

async function insertInBatches<T>(label: string, rows: T[], insert: (batch: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    // eslint-disable-next-line no-await-in-loop -- sequential on purpose: keeps memory/connection use bounded on a remote DB.
    await insert(batch);
    console.log(`  ${label}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
}

async function main() {
  const existingReviews = await prisma.review.count();
  if (existingReviews > 0) {
    console.log(`Reviews already seeded (${existingReviews} found). Skipping — run db:wipe first to reseed.`);
    return;
  }

  console.log('Loading products + reviewer pool...');
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      variants: { take: 1, select: { id: true, sku: true, price: true } },
    },
  });
  const reviewers = await ensureReviewerPool();
  console.log(`${products.length} products, ${reviewers.length} reviewers available.`);

  const orders: Prisma.OrderCreateManyInput[] = [];
  const orderItems: Prisma.OrderItemCreateManyInput[] = [];
  const reviews: Prisma.ReviewCreateManyInput[] = [];

  let orderSeq = 0;

  for (let p = 0; p < products.length; p += 1) {
    const product = products[p];
    const variant = product.variants[0];
    const reviewCount = 3 + Math.floor(rand() * 6); // 3-8

    const reviewerIdx = shuffledIndices(reviewers.length).slice(0, Math.min(reviewCount, reviewers.length));

    for (let r = 0; r < reviewerIdx.length; r += 1) {
      const reviewer = reviewers[reviewerIdx[r]];
      const rating = weightedRating();
      const seed = p * 31 + r * 7;
      const { title, comment } = buildReviewText(product.name, rating, seed);
      const createdAt = pastDate(365);

      const isVerified = variant && rand() < VERIFIED_PURCHASE_RATE;
      let orderId: string | null = null;

      if (isVerified) {
        orderSeq += 1;
        orderId = crypto.randomUUID();
        const address = encryptJson({
          line1: '123 Seed Street', city: 'Kathmandu', country: 'Nepal', postalCode: '44600',
        });
        const purchasedAt = new Date(createdAt.getTime() - (2 + Math.floor(rand() * 12)) * 24 * 60 * 60 * 1000);
        const price = Number(variant.price);

        orders.push({
          id: orderId,
          orderNumber: `ORD-SEED-${orderSeq}`,
          invoiceNumber: `INV-SEED-${orderSeq}`,
          trackingNumber: `TRK-SEED-${orderSeq}`,
          userId: reviewer.id,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          paymentMethod: orderSeq % 2 === 0 ? 'ESEWA' : 'COD',
          paidAt: purchasedAt,
          subtotal: price,
          grandTotal: price,
          shippingAddress: address,
          billingAddress: address,
          createdAt: purchasedAt,
          updatedAt: purchasedAt,
        });
        orderItems.push({
          id: crypto.randomUUID(),
          orderId,
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantSku: variant.sku,
          originalPrice: price,
          unitPrice: price,
          quantity: 1,
          lineTotal: price,
          createdAt: purchasedAt,
        });
      }

      // Mostly approved (what shoppers actually see) with a slice held back
      // in moderation states so the admin review queue isn't empty.
      const statusRoll = rand();
      const status = statusRoll < 0.92 ? 'APPROVED' : statusRoll < 0.97 ? 'PENDING' : 'REJECTED';
      const hasAdminReply = status === 'APPROVED' && rand() < 0.15;

      reviews.push({
        id: crypto.randomUUID(),
        productId: product.id,
        userId: reviewer.id,
        orderId,
        rating,
        title,
        comment,
        status,
        adminReply: hasAdminReply ? pickAdminReply(seed) : null,
        adminRepliedAt: hasAdminReply
          ? new Date(createdAt.getTime() + (1 + Math.floor(rand() * 4)) * 24 * 60 * 60 * 1000)
          : null,
        createdAt,
        updatedAt: createdAt,
      });
    }

    if ((p + 1) % 50 === 0) console.log(`  built reviews for ${p + 1}/${products.length} products...`);
  }

  console.log(`Inserting ${orders.length} verified-purchase orders...`);
  await insertInBatches('orders', orders, (batch) => prisma.order.createMany({ data: batch, skipDuplicates: true }));

  console.log(`Inserting ${orderItems.length} order items...`);
  await insertInBatches('order items', orderItems, (batch) => prisma.orderItem.createMany({ data: batch, skipDuplicates: true }));

  console.log(`Inserting ${reviews.length} reviews...`);
  await insertInBatches('reviews', reviews, (batch) => prisma.review.createMany({ data: batch, skipDuplicates: true }));

  const verifiedCount = reviews.filter((r) => r.orderId).length;
  const avgRating = reviews.reduce((sum, r) => sum + (r.rating as number), 0) / reviews.length;
  console.log('\nDone.');
  console.log(`  Reviews created: ${reviews.length}`);
  console.log(`  Verified purchases: ${verifiedCount} (${Math.round((verifiedCount / reviews.length) * 100)}%)`);
  console.log(`  Overall average rating: ${avgRating.toFixed(2)}`);
  console.log(`  Products covered: ${products.length}`);
}

main()
  .catch((err) => {
    console.error('Review seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
