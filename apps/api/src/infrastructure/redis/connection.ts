import { Redis } from 'ioredis';
import { env } from '@api/config/env';
import { logger } from '@api/core/logger/logger';

export let redisClient: any = null;

class MockRedis {
  private store = new Map<string, string>();

  async get(key: string) {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, ...args: any[]) {
    this.store.set(key, value);
    return 'OK';
  }

  async del(...keys: string[]) {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async scan(cursor: string | number, ...args: any[]): Promise<[string, string[]]> {
    // In-memory mock returns all keys
    const matchIdx = args.indexOf('MATCH');
    const pattern = matchIdx !== -1 && args[matchIdx + 1] ? args[matchIdx + 1] : '*';
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    const matchedKeys: string[] = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        matchedKeys.push(key);
      }
    }
    return ['0', matchedKeys];
  }

  pipeline() {
    const operations: Array<() => void> = [];
    const pipe = {
      del: (key: string) => {
        operations.push(() => this.store.delete(key));
        return pipe;
      },
      exec: async () => {
        operations.forEach((op) => op());
        return [];
      },
    };
    return pipe;
  }

  async quit() {}
  async connect() {}
}

export const connectRedis = async (uri?: string): Promise<void> => {
  const connectionString = uri || env.REDIS_URL || env.REDIS_URI;
  if (!connectionString) {
    if (env.NODE_ENV !== 'production') {
      logger.warn('No REDIS_URL provided, falling back to in-memory MockRedis for development');
      redisClient = new MockRedis();
    }
    return;
  }

  try {
    const client = new Redis(connectionString, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Disable retries on initial connect failure for fast fallback
      enableOfflineQueue: false,
    });

    client.on('error', (err) => {
      // Suppress unhandled crash logs if disconnected in local development
      if (env.NODE_ENV === 'production') {
        logger.error({ err }, 'Redis connection error');
      }
    });

    await client.connect();
    redisClient = client;
    logger.info('Connected to Redis');
  } catch (err) {
    if (env.NODE_ENV !== 'production') {
      logger.warn('Failed to connect to Redis, falling back to in-memory MockRedis for development');
      redisClient = new MockRedis();
    } else {
      throw err;
    }
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
