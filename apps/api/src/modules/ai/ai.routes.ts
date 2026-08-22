import { Router } from 'express';
import { aiController } from './ai.controller';
import { requireAuth } from '../auth/auth.middleware';
import { requireOrganizationContext } from '../tenant/tenant.middleware';
import { requirePermission } from '../auth/rbac.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationContext);

// AI features require AI permission (or simply CREATE:POST permission since it's an editor tool)
// For simplicity, we require CREATE:POST as you need this to use the editor anyway.
router.post('/generate-draft', requirePermission('CREATE', 'POST'), aiController.generateDraft);
router.post('/rewrite', requirePermission('UPDATE', 'POST'), aiController.rewriteText);
router.post('/extract-seo', requirePermission('UPDATE', 'POST'), aiController.extractSeo);
router.get('/job/:jobId', aiController.checkJobStatus);

export const aiRoutes: import('express').Router = router;
