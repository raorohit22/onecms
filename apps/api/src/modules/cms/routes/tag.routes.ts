import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { requireAuth } from '@api/modules/auth/auth.middleware';
import { requireOrganizationContext } from '@api/modules/tenant/tenant.middleware';
import { requirePermission } from '@api/modules/auth/rbac.middleware';
import { validateRequest } from '@api/core/middleware/validate.middleware';
import { createTagSchema, updateTagSchema, byIdSchema } from '../cms.schemas';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationContext);

router.post(
  '/tag',
  requirePermission('CREATE', 'TAG'),
  validateRequest(createTagSchema),
  tagController.create
);

router.get(
  '/tags',
  requirePermission('READ', 'TAG'),
  tagController.list
);

router.get(
  '/tag/:id',
  requirePermission('READ', 'TAG'),
  validateRequest(byIdSchema),
  tagController.getById
);

router.patch(
  '/tag/:id',
  requirePermission('UPDATE', 'TAG'),
  validateRequest(updateTagSchema),
  tagController.update
);

router.delete(
  '/tag/:id',
  requirePermission('DELETE', 'TAG'),
  validateRequest(byIdSchema),
  tagController.delete
);

router.post(
  '/tags/bulk-delete',
  requirePermission('DELETE', 'TAG'),
  tagController.bulkDelete
);

router.get(
  '/tags/export',
  requirePermission('EXPORT', 'TAG'),
  tagController.export
);

router.post(
  '/tags/import',
  requirePermission('IMPORT', 'TAG'),
  tagController.import
);

export const tagRoutes: Router = router;
