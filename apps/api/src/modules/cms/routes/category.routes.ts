import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { requireAuth } from '@api/modules/auth/auth.middleware';
import { requireOrganizationContext } from '@api/modules/tenant/tenant.middleware';
import { requirePermission } from '@api/modules/auth/rbac.middleware';
import { validateRequest } from '@api/core/middleware/validate.middleware';
import { createCategorySchema, updateCategorySchema, byIdSchema } from '../cms.schemas';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationContext);

router.post(
  '/category',
  requirePermission('CREATE', 'CATEGORY'),
  validateRequest(createCategorySchema),
  categoryController.create
);

router.get(
  '/categories',
  requirePermission('READ', 'CATEGORY'),
  categoryController.list
);

router.get(
  '/category/:id',
  requirePermission('READ', 'CATEGORY'),
  validateRequest(byIdSchema),
  categoryController.getById
);

router.patch(
  '/category/:id',
  requirePermission('UPDATE', 'CATEGORY'),
  validateRequest(updateCategorySchema),
  categoryController.update
);

router.delete(
  '/category/:id',
  requirePermission('DELETE', 'CATEGORY'),
  validateRequest(byIdSchema),
  categoryController.delete
);

router.post(
  '/categories/bulk-delete',
  requirePermission('DELETE', 'CATEGORY'),
  categoryController.bulkDelete
);

router.get(
  '/categories/export',
  requirePermission('EXPORT', 'CATEGORY'),
  categoryController.export
);

router.post(
  '/categories/import',
  requirePermission('IMPORT', 'CATEGORY'),
  categoryController.import
);

export const categoryRoutes: Router = router;
