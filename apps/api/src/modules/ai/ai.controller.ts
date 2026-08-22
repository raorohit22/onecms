import { Request, Response, NextFunction } from 'express';
import { aiQueue } from './ai.queue';

export const aiController = {
  generateDraft: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ error: 'Bad Request', message: 'Prompt is required' });
        return;
      }
      
      const job = await aiQueue.add('generate-draft', { type: 'generate-draft', payload: { prompt } });
      res.status(202).json({ jobId: job.id, status: 'pending' });
    } catch (error) {
      next(error);
    }
  },

  rewriteText: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, instruction } = req.body;
      if (!text || !instruction) {
        res.status(400).json({ error: 'Bad Request', message: 'Text and instruction are required' });
        return;
      }
      
      const job = await aiQueue.add('rewrite-text', { type: 'rewrite-text', payload: { text, instruction } });
      res.status(202).json({ jobId: job.id, status: 'pending' });
    } catch (error) {
      next(error);
    }
  },

  extractSeo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      if (!content) {
        res.status(400).json({ error: 'Bad Request', message: 'Content is required' });
        return;
      }
      
      const job = await aiQueue.add('extract-seo', { type: 'extract-seo', payload: { content } });
      res.status(202).json({ jobId: job.id, status: 'pending' });
    } catch (error) {
      next(error);
    }
  },

  checkJobStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        res.status(400).json({ error: 'Bad Request', message: 'Job ID is required' });
        return;
      }

      const job = await aiQueue.getJob(jobId);
      if (!job) {
        res.status(404).json({ error: 'Not Found', message: 'Job not found' });
        return;
      }

      const state = await job.getState();
      const progress = job.progress;
      const result = job.returnvalue;
      const failedReason = job.failedReason;

      res.status(200).json({ id: job.id, state, progress, result, failedReason });
    } catch (error) {
      next(error);
    }
  }
};
