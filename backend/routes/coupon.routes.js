// /api/coupons/* — what the signed-in customer can use; codes are checked per customer.
import { Router } from 'express';
import * as coupons from '../controllers/coupon.controller.js';
import { requireUser } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireUser, coupons.listCoupons);
router.get('/:code', requireUser, coupons.getCoupon);

export default router;
