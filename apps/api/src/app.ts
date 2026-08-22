import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from '@api/config/env';
import { requestIdMiddleware } from '@api/core/middleware/request-id.middleware';
import { loggingMiddleware } from '@api/core/middleware/logging.middleware';
import { notFoundMiddleware } from '@api/core/middleware/not-found.middleware';
import { errorMiddleware } from '@api/core/middleware/error.middleware';
import { apiRouter } from '@api/routes';

export function createApp(): express.Express {
  const app = express();

  // 1. Request ID
  app.use(requestIdMiddleware);

  // 2. CORS (Environment driven with safe local dev fallbacks)
  const defaultLocalOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ];

  const configuredOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : defaultLocalOrigins;

  const corsOptions = {
    origin: configuredOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-Requested-With', 'Accept']
  };
  app.use(cors(corsOptions));
  app.use(cookieParser());

  // 3. Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // 4. Body parsing with limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 5. Logging
  app.use(loggingMiddleware);


  // 6. Routes
  app.use('/', apiRouter);

  // 7. 404 Handler
  app.use(notFoundMiddleware);

  // 8. Error Handler
  app.use(errorMiddleware);

  return app;
}
