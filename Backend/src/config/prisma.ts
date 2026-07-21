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
