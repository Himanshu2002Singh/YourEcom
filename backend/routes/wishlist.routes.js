// /api/wishlist/* — only ever the signed-in customer's own list.
import { Router } from 'express';
import * as wishlist from '../controllers/wishlist.controller.js';
import { requireUser } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireUser, wishlist.getWishlist);
router.put('/:productId', requireUser, wishlist.saveProduct);
router.delete('/:productId', requireUser, wishlist.removeProduct);

export default router;
