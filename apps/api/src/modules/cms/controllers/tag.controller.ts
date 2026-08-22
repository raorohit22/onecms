import { Request, Response, NextFunction } from 'express';
import { tagService } from '../services/tag.service';
import { extractPagination } from './pagination.util';

export const tagController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = { ...req.body, createdBy: req.user?.userId };
      const tag = await tagService.createTag(payload, req.tenant!);
      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await tagService.getTagById(req.params.id as string, req.tenant!);
      res.status(200).json(tag);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip, sortField, sortDir } = extractPagination(req);

      const { data, total } = await tagService.listTags(req.tenant!, {
        skip,
        limit,
        sort: { [sortField]: sortDir }
      });

      res.status(200).json({
        data,
        meta: {
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await tagService.updateTag(req.params.id as string, req.body, req.tenant!);
      res.status(200).json(tag);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tagService.deleteTag(req.params.id as string, req.tenant!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await tagService.deleteManyTags(req.tenant!, req.body);
      res.status(200).json({ success: true, count });
    } catch (error) {
      next(error);
    }
  },

  export: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await tagService.exportTags(req.tenant!);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  import: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Expected an array of JSON objects' });
      }
      const result = await tagService.importTags(req.body, req.tenant!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
