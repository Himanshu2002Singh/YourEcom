// /api/products/*
import { Router } from 'express';
import * as products from '../controllers/product.controller.js';
import * as reviews from '../controllers/review.controller.js';
import { loadUser, requireUser } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/', products.listProducts);
router.get('/:id', products.getProduct);
router.get('/:id/reviews', loadUser, reviews.listReviews);
router.put('/:id/reviews', requireUser, rateLimit({ limit: 20, windowMs: 10 * 60_000 }), reviews.saveReview);

export default router;
