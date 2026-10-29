// /api/auth/*
import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Sign-in attempts are counted per email address, so no account's password can be guessed quickly.
const loginLimit = rateLimit({ limit: 10, windowMs: 15 * 60_000, key: request => `login:${String(request.body?.email ?? '').trim().toLowerCase()}` });

// Reset emails are counted per address too, so nobody's inbox can be flooded with them.
const resetEmailLimit = rateLimit({ limit: 3, windowMs: 15 * 60_000, key: request => `reset:${String(request.body?.email ?? '').trim().toLowerCase()}` });

router.post('/register', auth.register);
router.post('/login', loginLimit, auth.login);
router.post('/logout', auth.logout);
router.post('/forgot-password', resetEmailLimit, auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

export default router;
