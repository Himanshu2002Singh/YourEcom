// Paying for orders online through Razorpay (utils/razorpay.js). An order paid online is placed like any other,
// with its payment pending, and counts as paid (paid_at) once Razorpay has the money: when the customer's browser
// reports the payment, or when Razorpay's webhook does, whichever comes first.
import * as Order from '../models/order.model.js';
import { HttpError } from '../utils/HttpError.js';
import { capturedPayment, checkoutSignatureValid, createRazorpayOrder, razorpayKeyId, razorpayReady, webhookSignatureValid } from '../utils/razorpay.js';

const paise = rupees => rupees * 100;

const notReady = () => new HttpError(503, 'Online payment isn’t available right now. Choose cash on delivery instead.');

// What Razorpay Checkout needs in the browser to collect an order's payment. The Razorpay order is made the first
// time and kept on the order, so paying again after closing the payment window pays the same one.
export async function startPayment(order, user) {
  if (!razorpayReady()) throw notReady();
  let razorpayOrderId = order.razorpay_order_id;
  if (!razorpayOrderId) {
    let created;
    try {
      created = await createRazorpayOrder(paise(order.total), order.id);
    } catch (error) {
      console.error(error);
      throw new HttpError(502, 'We couldn’t start the online payment. Try again in a moment, or choose cash on delivery.');
    }
    razorpayOrderId = await Order.setRazorpayOrder(order.id, created.id);
  }
  return {
    keyId: razorpayKeyId(),
    orderId: razorpayOrderId,
    amount: paise(order.total),
    currency: 'INR',
    description: `Order #${order.id}`,
    prefill: { name: order.delivery.name, email: user.email, contact: order.delivery.phone },
  };
}

// Marks the order paid by `payment` (a Razorpay payment), if it is the order's full amount and captured. Anything
// else is left for a person to look into: answers false.
async function recordPayment(order, payment) {
  if (payment.order_id !== order.razorpay_order_id || payment.amount !== paise(order.total) || payment.status !== 'captured') {
    console.error(`Razorpay payment ${payment.id} (${payment.status}, ${payment.amount} paise, ${payment.order_id}) doesn’t pay order ${order.id}.`);
    return false;
  }
  await Order.markPaid(order.id, payment.id);
  return true;
}

// The payment Razorpay Checkout reported for one of the customer's orders. The signature proves Razorpay made it
// for this order; Razorpay is then asked for the payment itself, which is captured if it needs to be.
export async function confirmPayment(order, { paymentId, signature }) {
  if (!razorpayReady()) throw notReady();
  if (!order.razorpay_order_id || !checkoutSignatureValid(order.razorpay_order_id, paymentId, signature)) {
    throw new HttpError(400, 'This payment couldn’t be verified. If money left your account, contact us with your order number.');
  }
  if (order.paid_at) return; // the webhook got here first
  let payment;
  try {
    payment = await capturedPayment(paymentId);
  } catch (error) {
    console.error(error);
    throw new HttpError(502, 'We couldn’t confirm your payment with Razorpay. Refresh in a minute: if it went through, the order will show as paid.');
  }
  if (!(await recordPayment(order, payment))) throw new HttpError(409, 'This payment doesn’t match the order. Contact us with your order number.');
}

// Razorpay's webhook (POST /api/payments/razorpay/webhook), signed with the webhook secret. A captured payment
// marks its order paid even when the customer closed the page before the store heard back. Other events, and
// payments for no order of this store, are acknowledged and ignored.
export async function handleWebhook(rawBody, signature, event) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) throw new HttpError(503, 'Razorpay webhooks aren’t set up on this server.');
  if (!webhookSignatureValid(rawBody, signature)) throw new HttpError(400, 'The webhook signature doesn’t match.');
  if (event?.event !== 'payment.captured') return;
  const payment = event.payload?.payment?.entity;
  const order = payment?.order_id ? await Order.findByRazorpayOrder(payment.order_id) : null;
  if (order && !order.paid_at) await recordPayment(order, payment);
}
