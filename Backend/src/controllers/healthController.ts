import { Request, Response } from 'express';

import { env } from '../config/env';
import { HealthStatus } from '../types';
import { success } from '../utils/response';
import { prisma } from '../config/prisma';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  let dbOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  const health: HealthStatus & { db: 'up' | 'down' } = {
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'up' : 'down',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: env.apiVersion,
  };
  success(res, health, 'API is healthy.');
};
