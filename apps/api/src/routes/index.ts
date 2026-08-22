import { Router } from 'express';
import { healthRoutes } from '@api/modules/health/health.routes';
import { authRoutes } from '@api/modules/auth/auth.routes';
import { cmsRoutes } from '@api/modules/cms/cms.routes';
import { mediaRoutes } from '@api/modules/media/media.routes';
import { aiRoutes } from '@api/modules/ai/ai.routes';
import masterRoutes from '@api/modules/masters/routes/master.routes';
import { settingsRoutes } from '@api/modules/settings/settings.routes';
import { usersRoutes } from '@api/modules/users/users.routes';

const router: Router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/ai', aiRoutes);
router.use('/masters', masterRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', usersRoutes);
router.use('/', cmsRoutes);

export { router as apiRouter };
