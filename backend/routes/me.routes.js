// /api/me/*
import { Router } from 'express';
import * as me from '../controllers/me.controller.js';
import { loadUser, requireUser } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/', loadUser, me.getProfile);
router.put('/', requireUser, me.saveName);
// Limited so a stolen session can't be used to guess the current password.
router.put('/password', requireUser, rateLimit({ limit: 10, windowMs: 15 * 60_000 }), me.changePassword);
router.put('/preferences', requireUser, me.savePreferences);

export default router;
