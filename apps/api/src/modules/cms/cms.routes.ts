import { Router } from 'express';
import { postRoutes } from './routes/post.routes';
import { categoryRoutes } from './routes/category.routes';
import { tagRoutes } from './routes/tag.routes';
import { dashboardRoutes } from './routes/dashboard.routes';

const router = Router();

router.use('/', postRoutes);
router.use('/', categoryRoutes);
router.use('/', tagRoutes);
router.use('/dashboard', dashboardRoutes);

export const cmsRoutes: Router = router;
