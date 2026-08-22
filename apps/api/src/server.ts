import { createApp } from '@api/app';
import { env } from '@api/config/env';
import { logger } from '@api/core/logger/logger';
import { connectDatabase, disconnectDatabase } from '@api/infrastructure/database/connection';
import { connectRedis, disconnectRedis } from '@api/infrastructure/redis/connection';
import '@api/modules/ai/ai.queue'; // Initialize background workers

async function startServer() {
  try {
    // Initialize infrastructure dependencies before accepting traffic
    await connectDatabase();
    await connectRedis();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server started on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    const gracefulShutdown = async () => {
      logger.info('Received shutdown signal, closing server...');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await disconnectRedis();
          await disconnectDatabase();
          process.exit(0);
        } catch {
          logger.error('Error during infrastructure disconnection on shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
