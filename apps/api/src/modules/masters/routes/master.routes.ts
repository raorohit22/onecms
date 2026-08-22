import { Router } from 'express';
import { masterController } from '../controllers/master.controller';
import { requireAuth } from '@api/modules/auth/auth.middleware';
import { requireOrganizationContext } from '@api/modules/tenant/tenant.middleware';
import { requirePermission } from '@api/modules/auth/rbac.middleware';

const router: Router = Router();

// Secure all master routes
router.use(requireAuth);
router.use(requireOrganizationContext);

// --- Master Types ---
router.get('/types', masterController.getTypes);
// Admin only for creating/updating types
router.post('/types', requirePermission('CREATE', 'MASTER_TYPE'), masterController.createType);
router.get('/types/:slug', masterController.getTypeBySlug);
router.put('/types/:id', requirePermission('UPDATE', 'MASTER_TYPE'), masterController.updateType);
router.delete('/types/:id', requirePermission('DELETE', 'MASTER_TYPE'), masterController.deleteType);

// --- Master Data (Values) ---
// typeId can be the actual ObjectId or the slug
router.get('/:typeId/data', masterController.getValues);
router.post('/:typeId/data', requirePermission('CREATE', 'MASTER_VALUE'), masterController.createValue);
router.put('/:typeId/data/:id', requirePermission('UPDATE', 'MASTER_VALUE'), masterController.updateValue);
router.delete('/:typeId/data/:id', requirePermission('DELETE', 'MASTER_VALUE'), masterController.deleteValue);
router.post('/:typeId/data/bulk-delete', requirePermission('DELETE', 'MASTER_VALUE'), masterController.bulkDeleteValues);

router.get('/:typeId/data/export', requirePermission('EXPORT', 'MASTER_VALUE'), masterController.exportValues);
router.post('/:typeId/data/import', requirePermission('IMPORT', 'MASTER_VALUE'), masterController.importValues);

export default router;
