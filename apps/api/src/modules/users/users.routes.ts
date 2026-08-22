import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../auth/auth.middleware';
import { requirePermission } from '../auth/rbac.middleware';
import { requireOrganizationContext } from '../tenant/tenant.middleware';

const router: Router = Router();

// Protect all routes
router.use(requireAuth);
router.use(requireOrganizationContext);

router.get(
  '/',
  requirePermission('READ', 'MEMBERS'),
  usersController.findAll
);

router.post(
  '/bulk-delete',
  requirePermission('MANAGE', 'MEMBERS'),
  usersController.bulkDelete
);

router.get(
  '/export',
  requirePermission('MANAGE', 'MEMBERS'), // Assuming manage permission for export for now
  usersController.export
);

router.post(
  '/import',
  requirePermission('MANAGE', 'MEMBERS'),
  usersController.import
);
router.post('/', requirePermission('MANAGE', 'MEMBERS'), usersController.create);
router.put('/:id', requirePermission('MANAGE', 'MEMBERS'), usersController.update);
router.delete('/:id', requirePermission('MANAGE', 'MEMBERS'), usersController.delete);

export { router as usersRoutes };
