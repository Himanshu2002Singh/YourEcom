// /api/payments/* — Razorpay's calls to the store. They carry no session: each is signed instead.
import { Router } from 'express';
import { razorpayWebhook } from '../controllers/payment.controller.js';

const router = Router();

router.post('/razorpay/webhook', razorpayWebhook);

export default router;
