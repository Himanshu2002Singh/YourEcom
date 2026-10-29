// /api/orders/* — only ever the signed-in customer's own orders.
import { Router } from 'express';
import * as orders from '../controllers/order.controller.js';
import { requireUser } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/', requireUser, rateLimit({ limit: 20, windowMs: 10 * 60_000 }), orders.placeOrder);
router.get('/', requireUser, orders.listOrders);
router.get('/:id', requireUser, orders.getOrder);
router.post('/:id/cancel', requireUser, orders.cancelOrder);

export default router;
