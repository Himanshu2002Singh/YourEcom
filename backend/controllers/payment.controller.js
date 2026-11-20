// /api/payments — Razorpay's calls to the store.
import { handleWebhook } from '../services/payment.service.js';

// POST /api/payments/razorpay/webhook — signed by Razorpay, so it needs no session. app.js keeps the body's exact
// bytes (request.rawBody), which the signature covers.
export async function razorpayWebhook(request, response) {
  await handleWebhook(request.rawBody, request.get('X-Razorpay-Signature'), request.body);
  response.json({ ok: true });
}
