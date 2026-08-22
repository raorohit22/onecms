import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { requireAuth } from '@api/modules/auth/auth.middleware';
import { requireOrganizationContext } from '@api/modules/tenant/tenant.middleware';
import { requirePermission } from '@api/modules/auth/rbac.middleware';
import { validateRequest } from '@api/core/middleware/validate.middleware';
import { createPostSchema, updatePostSchema, byIdSchema, listQuerySchema } from '../cms.schemas';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationContext);

router.post(
  '/post',
  requirePermission('CREATE', 'POST'),
  validateRequest(createPostSchema),
  postController.create
);

router.get(
  '/posts',
  requirePermission('READ', 'POST'),
  validateRequest(listQuerySchema),
  postController.list
);

router.post(
  '/posts/bulk-delete',
  requirePermission('DELETE', 'POST'),
  postController.bulkDelete
);

router.get(
  '/posts/export',
  requirePermission('EXPORT', 'POST'),
  postController.export
);

router.post(
  '/posts/import',
  requirePermission('IMPORT', 'POST'),
  postController.import
);

router.get(
  '/post/:id',
  requirePermission('READ', 'POST'),
  validateRequest(byIdSchema),
  postController.getById
);

router.get(
  '/post/:id/revisions',
  requirePermission('READ', 'POST'),
  postController.getRevisions
);

router.patch(
  '/post/:id',
  requirePermission('UPDATE', 'POST'),
  validateRequest(updatePostSchema),
  postController.update
);

router.delete(
  '/post/:id',
  requirePermission('DELETE', 'POST'),
  validateRequest(byIdSchema),
  postController.delete
);

export const postRoutes: Router = router;
