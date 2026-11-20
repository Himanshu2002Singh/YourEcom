// /api/store — public: the storefront loads it before showing any page.
import { Router } from 'express';
import { getStore } from '../controllers/store.controller.js';

const router = Router();

router.get('/', getStore);

export default router;
