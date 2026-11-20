import type { PaymentDetails } from '@/types/store';

// Razorpay Checkout, the payment window that takes card, UPI and netbanking payments for an order paid online.
// Its script loads the first time a customer pays. https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

// What Razorpay Checkout hands back once the customer has paid, for the API to check (POST /api/orders/:id/payment).
export type PaymentResult = { razorpayPaymentId: string; razorpaySignature: string };

type CheckoutResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type Checkout = { open: () => void };
declare global {
  interface Window {
    Razorpay?: new (options: object) => Checkout;
  }
}

const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
const LOAD_ERROR = 'The payment window couldn’t open. Check your connection and try again.';
let loading: Promise<void> | undefined;

function loadCheckout(): Promise<void> {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = undefined; // try again next time
      script.remove();
      reject(new Error(LOAD_ERROR));
    };
    document.body.append(script);
  });
  return loading;
}

// Opens the payment window for an order. Resolves with the payment once the customer has paid, or null if they
// closed the window without paying. A failed attempt stays in the window, which lets them try again.
export async function payWithRazorpay(details: PaymentDetails): Promise<PaymentResult | null> {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error(LOAD_ERROR);
  return new Promise((resolve) => {
    new Razorpay({
      key: details.keyId,
      order_id: details.orderId,
      amount: details.amount,
      currency: details.currency,
      name: 'YourEcom',
      description: details.description,
      prefill: details.prefill,
      theme: { color: '#1558c0' }, // the brand blue (tailwind.config.js)
      handler: (response: CheckoutResponse) => resolve({ razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }),
      modal: { ondismiss: () => resolve(null) },
    }).open();
  });
}
