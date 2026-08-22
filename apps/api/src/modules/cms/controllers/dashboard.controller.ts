import { Request, Response, NextFunction } from 'express';

import { postRepository } from '../repositories/post.repository';
import { categoryRepository } from '../repositories/category.repository';
import { tagRepository } from '../repositories/tag.repository';

export const dashboardController = {
  getStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = req.tenant!;
      
      const [postsCount, categoriesCount, tagsCount] = await Promise.all([
        postRepository.count({}, context),
        categoryRepository.count({}, context),
        tagRepository.count({}, context)
      ]);

      res.status(200).json({
        posts: postsCount,
        categories: categoriesCount,
        tags: tagsCount
      });
    } catch (error) {
      next(error);
    }
  }
};
