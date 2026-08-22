import { Request, Response, NextFunction } from 'express';
import { mediaService } from './media.service';

export const mediaController = {
  upload: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Bad Request', message: 'No file uploaded' });
        return;
      }
      
      const file = req.file;
      const uploaderId = (req as any).user!.userId;
      
      const media = await mediaService.saveMediaRecord(file, (req as any).tenant!, uploaderId);
      res.status(201).json(media);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await mediaService.listMedia(req.tenant!, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await mediaService.deleteMedia(req.params.id as string, req.tenant!);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Media not found') {
        res.status(404).json({ error: 'Not Found', message: 'Media not found' });
        return;
      }
      next(error);
    }
  }
};
