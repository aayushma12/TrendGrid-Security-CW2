import morgan, { StreamOptions } from 'morgan';

import { logger } from '../utils/logger';
import { isProduction } from '../config/env';

const stream: StreamOptions = {
  write: (message) => logger.info(message.trim()),
};

export const requestLogger = morgan(isProduction ? 'combined' : 'dev', { stream });
