// Every API endpoint, mounted under /api by app.js.
import { Router } from 'express';
import { health } from '../controllers/health.controller.js';
import authRoutes from './auth.routes.js';
import meRoutes from './me.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';
import wishlistRoutes from './wishlist.routes.js';

const router = Router();

router.get('/health', health);
router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/wishlist', wishlistRoutes);

export default router;
