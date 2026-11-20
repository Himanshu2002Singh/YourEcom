// Razorpay, which takes the store's card and UPI payments, through its REST API (https://razorpay.com/docs/api/).
// The keys come from backend/.env (see .env.example); without both of them, checkout offers cash on delivery only.
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.razorpay.com/v1';

export const razorpayReady = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID;

// One API call: a GET without a body, a POST with one. Rejects with Razorpay's own description of what went wrong,
// for the server's log.
async function call(path, body) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${auth}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Razorpay ${path} answered ${response.status}: ${data?.error?.description ?? 'no description'}`);
  return data;
}

// A Razorpay order for `amount` paise, which Razorpay Checkout then collects. `receipt` is the store's order
// number, so the Razorpay Dashboard shows which order each payment is for.
export const createRazorpayOrder = (amount, receipt) => call('/orders', { amount, currency: 'INR', receipt, notes: { order: receipt } });

// The payment as Razorpay has it. One that is only authorized (an account that doesn't capture payments by
// itself) is captured first, since Razorpay refunds payments left uncaptured.
export async function capturedPayment(paymentId) {
  const payment = await call(`/payments/${paymentId}`);
  if (payment.status !== 'authorized') return payment;
  try {
    return await call(`/payments/${paymentId}/capture`, { amount: payment.amount, currency: payment.currency });
  } catch (error) {
    // The webhook may have captured it a moment ago.
    const again = await call(`/payments/${paymentId}`);
    if (again.status === 'captured') return again;
    throw error;
  }
}

const hmac = (secret, text) => createHmac('sha256', secret).update(text).digest('hex');
const sameHex = (expected, given) => typeof given === 'string' && given.length === expected.length && timingSafeEqual(Buffer.from(expected), Buffer.from(given));

// Razorpay Checkout's proof that a payment for `orderId` went through: an HMAC of "orderId|paymentId" made with
// the key secret, which only Razorpay and this server know.
export const checkoutSignatureValid = (orderId, paymentId, signature) => sameHex(hmac(process.env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), signature);

// A webhook's X-Razorpay-Signature: an HMAC of the request body, exactly as it was sent, made with the webhook secret.
export const webhookSignatureValid = (rawBody, signature) =>
  Boolean(process.env.RAZORPAY_WEBHOOK_SECRET && rawBody) && sameHex(hmac(process.env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);
