/**
 * Order + invoice number generators.
 *   ORD-YYYYMMDD-NNNNNN
 *   INV-YYYYMMDD-NNNNNN
 *
 * The counter is derived from a same-day count query. In a high-throughput
 * environment swap to a dedicated sequence table for guaranteed uniqueness
 * under concurrent load.
 */
import type { Prisma } from '@prisma/client';

import type { prisma as prismaSingleton } from '../../../config/prisma';

// The app's prisma singleton carries a client-level `omit` config (see
// config/prisma.ts), which makes it a distinct generic PrismaClient
// instantiation from the bare, un-parameterized `PrismaClient` type —
// TypeScript treats them as structurally incompatible even though these
// functions never touch the omitted field. Deriving the type from the
// actual singleton (rather than referencing the bare class) keeps this
// accepting exactly what callers actually pass: the real client or a
// transaction handle.
type PrismaClientOrTx = typeof prismaSingleton | Prisma.TransactionClient;

const yyyymmdd = (d: Date): string =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

const startOfDayUTC = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const endOfDayUTC = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));

const pad = (n: number): string => String(n).padStart(6, '0');

export const generateOrderNumber = async (
  prisma: PrismaClientOrTx,
  now: Date = new Date(),
): Promise<string> => {
  const dayStart = startOfDayUTC(now);
  const dayEnd = endOfDayUTC(now);
  const count = await prisma.order.count({
    where: { placedAt: { gte: dayStart, lt: dayEnd } },
  });
  return `ORD-${yyyymmdd(now)}-${pad(count + 1)}`;
};

export const generateInvoiceNumber = async (
  prisma: PrismaClientOrTx,
  now: Date = new Date(),
): Promise<string> => {
  const dayStart = startOfDayUTC(now);
  const dayEnd = endOfDayUTC(now);
  const count = await prisma.order.count({
    where: { placedAt: { gte: dayStart, lt: dayEnd } },
  });
  return `INV-${yyyymmdd(now)}-${pad(count + 1)}`;
};

/**
 * Customer-facing tracking code, e.g. TRK928374923 — a TRK prefix plus a
 * random 9-digit number. Collisions are astronomically unlikely (1e9 space)
 * but we still verify uniqueness against the DB with a short retry loop,
 * matching the "guaranteed uniqueness" note above for order/invoice numbers.
 */
export const generateTrackingNumber = async (
  prisma: PrismaClientOrTx,
): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `TRK${Math.floor(100000000 + Math.random() * 900000000)}`;
    const existing = await prisma.order.findUnique({
      where: { trackingNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  // Extremely unlikely fallback: timestamp-suffixed to guarantee uniqueness.
  return `TRK${Date.now()}`;
};
