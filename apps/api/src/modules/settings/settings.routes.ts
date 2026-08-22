import { Router } from 'express';
import { settingsController } from './settings.controller';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { requireOrganizationContext } from '../tenant/tenant.middleware';

const router:Router = Router();

// Middleware: All settings routes require auth and MANAGE:SETTINGS permission
router.use(requireAuth);
router.use(requireOrganizationContext);
// router.use(requirePermission('MANAGE', 'SETTINGS')); // We will enable this once the user has this permission mapped, for now just auth is fine.

// RBAC Routes
router.get('/roles', settingsController.getRoles);
router.post('/role', settingsController.createRole);
router.put('/roles/:id', settingsController.updateRole);
router.delete('/roles/:id', settingsController.deleteRole);

router.get('/permissions', settingsController.getPermissions);

export { router as settingsRoutes };
