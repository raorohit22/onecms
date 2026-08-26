import { Router } from 'express';
import { mediaController } from './media.controller';
import { uploadMiddleware } from './media.service';
import { requireAuth } from '../auth/auth.middleware';
import { requireOrganizationContext } from '../tenant/tenant.middleware';

const router = Router();

/**
 * Media routes — no separate RBAC required.
 * Any authenticated user who belongs to an organization can upload, view, and delete media.
 * Media is a utility resource that supports post creation; it inherits access from
 * the user's authenticated org membership rather than a dedicated permission.
 */
router.use(requireAuth);
router.use(requireOrganizationContext);

// Upload endpoint — any authenticated org member can upload
router.post('/', uploadMiddleware.single('file'), mediaController.upload);

// List endpoint — any authenticated org member can browse the media library
router.get('/', mediaController.list);

// Delete endpoint — any authenticated org member can remove their uploads
router.delete('/:id', mediaController.delete);

export const mediaRoutes: import('express').Router = router;
