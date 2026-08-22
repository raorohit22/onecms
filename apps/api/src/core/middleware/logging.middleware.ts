import pinoHttp from 'pino-http';
import { logger } from '@api/core/logger/logger';

export const loggingMiddleware = pinoHttp({
  logger,
  // pino-http automatically uses req.id if it exists
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.secret'
    ],
    censor: '[REDACTED]',
  },
});
