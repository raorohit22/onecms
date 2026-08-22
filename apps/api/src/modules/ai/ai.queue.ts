import { Queue, Worker, Job } from 'bullmq';
import { env } from '@api/config/env';
import { aiService } from './ai.service';
import { logger } from '@api/core/logger/logger';
import IORedis from 'ioredis';

// Reuse the existing redis URI setup structure, or create a new IORedis connection
const redisUri = env.REDIS_URI || env.REDIS_URL || 'redis://127.0.0.1:6379';

const connection = new IORedis(redisUri, {
  maxRetriesPerRequest: null, // BullMQ requires maxRetriesPerRequest to be null
  lazyConnect: true,
  retryStrategy: (times) => {
    // Retry up to 3 times in dev, then back off
    if (env.NODE_ENV !== 'production' && times > 3) {
      return null;
    }
    return Math.min(times * 1000, 5000);
  },
  enableOfflineQueue: false,
});

connection.on('error', (err) => {
  if (env.NODE_ENV === 'production') {
    logger.error({ err }, 'BullMQ Redis connection error');
  }
});

export const aiQueue = new Queue('ai-jobs', { connection });

export const aiWorker = new Worker(
  'ai-jobs',
  async (job: Job) => {
    const { type, payload } = job.data;

    logger.info(`Processing AI job ${job.id} of type ${type}`);

    switch (type) {
      case 'generate-draft':
        return await aiService.generateDraft(payload.prompt);

      case 'rewrite-text':
        return await aiService.rewriteText(payload.text, payload.instruction);

      case 'extract-seo':
        return await aiService.extractSeo(payload.content);

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  },
  { connection }
);

aiWorker.on('completed', (job) => {
  logger.info(`AI Job ${job.id} has completed!`);
});

aiWorker.on('failed', (job, err) => {
  logger.error(`AI Job ${job?.id} has failed with ${err.message}`);
});

aiWorker.on('error', (err) => {
  if (env.NODE_ENV === 'production') {
    logger.error({ err }, 'BullMQ Worker error');
  }
});
