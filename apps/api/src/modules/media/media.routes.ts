import { Router } from 'express';
import { mediaController } from './media.controller';
import { uploadMiddleware } from './media.service';
import { requireAuth } from '../auth/auth.middleware';
import { requireOrganizationContext } from '../tenant/tenant.middleware';
import { requirePermission } from '../auth/rbac.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationContext);

// Upload endpoint
router.post(
  '/', 
  requirePermission('CREATE', 'MEDIA'), 
  uploadMiddleware.single('file'), 
  mediaController.upload
);

// List endpoint
router.get('/', requirePermission('READ', 'MEDIA'), mediaController.list);

// Delete endpoint
router.delete('/:id', requirePermission('DELETE', 'MEDIA'), mediaController.delete);

export const mediaRoutes: import('express').Router = router;
