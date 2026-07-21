/**
 * Prisma client singleton. Every repository imports { prisma } from here.
 * Never instantiate PrismaClient elsewhere — it leaks connection pools.
 */
import { PrismaClient } from '@prisma/client';

import { env, isProduction } from './env';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['warn', 'error'],
  datasources: { db: { url: env.db.url } },
  // ORM-level guarantee (not just DTO discipline) that passwordHash never
  // rides along on an ordinary query. The two call sites that legitimately
  // need it (login, MFA/session flows needing UserWithPassword) opt back in
  // explicitly per-query via `omit: { passwordHash: false }` — see
  // features/user/repository/index.ts findByEmail / findByIdWithSecurity.
  omit: { user: { passwordHash: true } },
});

process.on('beforeExit', () => {
  logger.info('Prisma client disconnecting...');
});

export const connectPrisma = async (): Promise<void> => {
  await prisma.$connect();
  logger.info('Prisma connected to Postgres');
};

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};
