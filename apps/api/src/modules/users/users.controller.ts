import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export const usersController = {
  findAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      const pageNum = parseInt(req.query.page as string) || 1;
      const limitNum = parseInt(req.query.limit as string) || 10;
      const sortField = (req.query.sort as string) || 'createdAt';
      const sortDir = (req.query.dir as string) === 'asc' ? 1 : -1;
      const skip = (pageNum - 1) * limitNum;

      const { data, total } = await usersService.findAll(organizationId, {
        skip,
        limit: limitNum,
        sort: { [sortField]: sortDir }
      });
      
      res.status(200).json({
        data,
        meta: {
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
        }
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      const payload = { ...req.body, createdBy: req.user?.userId };
      const user = await usersService.create(payload, organizationId);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      const user = await usersService.update(req.params.id as string, req.body, organizationId);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      await usersService.delete(req.params.id as string, organizationId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  bulkDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      const count = await usersService.deleteMany(organizationId, req.body);
      res.status(200).json({ success: true, count });
    } catch (error) {
      next(error);
    }
  },

  export: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      const data = await usersService.exportUsers(organizationId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  import: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Expected an array of JSON objects' });
      }
      const result = await usersService.importUsers(req.body, organizationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
