import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { extractPagination } from './pagination.util';

export const categoryController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = { ...req.body, createdBy: req.user?.userId };
      const category = await categoryService.createCategory(payload, req.tenant!);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await categoryService.getCategoryById(req.params.id as string, req.tenant!);
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip, sortField, sortDir } = extractPagination(req);

      const { data, total } = await categoryService.listCategories(req.tenant!, {
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
      const category = await categoryService.updateCategory(req.params.id as string, req.body, req.tenant!);
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await categoryService.deleteCategory(req.params.id as string, req.tenant!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await categoryService.deleteManyCategories(req.tenant!, req.body);
      res.status(200).json({ success: true, count });
    } catch (error) {
      next(error);
    }
  },

  export: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await categoryService.exportCategories(req.tenant!);
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
      const result = await categoryService.importCategories(req.body, req.tenant!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
