// /api/admin/* — for the admin pages. Every route needs an admin's session (users.is_admin, set with npm run admin).
import { Router } from 'express';
import multer from 'multer';
import * as admin from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { MAX_PHOTOS_PER_UPLOAD, MAX_PHOTO_BYTES } from '../utils/uploads.js';

const router = Router();

// Photos are held in memory until utils/uploads.js has checked what they really are; then they're saved.
// The session is checked first, so nobody else's upload is ever read.
const photos = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_PHOTO_BYTES, files: MAX_PHOTOS_PER_UPLOAD, fields: 0 } });

router.use(requireAdmin);
router.get('/summary', admin.getSummary);
router.get('/orders', admin.listOrders);
router.get('/orders/:id', admin.getOrder);
router.put('/orders/:id/status', admin.setOrderStatus);
router.put('/products/:id', admin.updateProduct);
router.post('/uploads', photos.array('photos', MAX_PHOTOS_PER_UPLOAD), admin.uploadPhotos);

export default router;
