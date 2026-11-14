// /api/admin/* — for the admin pages. Every route needs an admin's session (users.is_admin, set with npm run admin).
import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAdmin);
router.get('/summary', admin.getSummary);
router.get('/orders', admin.listOrders);
router.get('/orders/:id', admin.getOrder);
router.put('/orders/:id/status', admin.setOrderStatus);
router.put('/products/:id', admin.updateProduct);

export default router;
