import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectPrisma, disconnectPrisma } from './config/prisma';

const bootstrap = async (): Promise<void> => {
  await connectPrisma();

  const server = app.listen(env.port, () => {
    logger.info(`NDH Trendgrid API running on port ${env.port} (${env.nodeEnv})`);
    logger.info(`Base URL: http://localhost:${env.port}${env.apiPrefix}`);
    if (env.swagger.enabled) {
      logger.info(`Swagger:  http://localhost:${env.port}${env.apiPrefix}${env.swagger.path}`);
    }
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down...`);
    server.close(async () => {
      await disconnectPrisma();
      logger.info('Server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after 10s.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  logger.error('Failed to bootstrap', err);
  process.exit(1);
});
