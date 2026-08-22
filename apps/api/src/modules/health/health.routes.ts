import { Router } from 'express';
import { getHealth, getHealthLive, getHealthReady } from './health.controller';

const router = Router();
router.get('/', getHealth);
router.get('/live', getHealthLive);
router.get('/ready', getHealthReady);

export const healthRoutes: Router = router;
