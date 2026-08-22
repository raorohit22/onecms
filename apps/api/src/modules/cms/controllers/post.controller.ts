import { Request, Response, NextFunction } from 'express';
import { postService } from '../services/post.service';
import { extractPagination } from './pagination.util';

export const postController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.createPost(req.body, req.tenant!);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.getPostById(req.params.id as string, req.tenant!);
      res.status(200).json(post);
    } catch (error) {
      next(error);
    }
  },

  getRevisions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const revisions = await postService.getPostRevisions(req.params.id as string, req.tenant!);
      res.status(200).json(revisions);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip, sortField, sortDir, filters } = extractPagination(req);

      const [data, total] = await Promise.all([
        postService.listPosts(filters, req.tenant!, {
          skip,
          limit,
          sort: { [sortField]: sortDir }
        }),
        postService.countPosts(filters, req.tenant!),
      ]);

      res.status(200).json({
        data,
        meta: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.updatePost(req.params.id as string, req.body, req.tenant!);
      res.status(200).json(post);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await postService.deletePost(req.params.id as string, req.tenant!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await postService.deleteManyPosts(req.tenant!, req.body);
      res.status(200).json({ success: true, count });
    } catch (error) {
      next(error);
    }
  },

  export: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.exportPosts(req.tenant!);
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
      const result = await postService.importPosts(req.body, req.tenant!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
