import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '@api/modules/auth/auth.middleware';
import { requireOrganizationContext } from '@api/modules/tenant/tenant.middleware';

const router = Router();

router.use(requireAuth);
router.use(requireOrganizationContext);

router.get('/', dashboardController.getStats);

export const dashboardRoutes: Router = router;
