import type { CartItem, Coupon, Product } from '@/types/store';

// The same rules as backend/services/pricing.service.js, which has the final say on every order.
export const FREE_DELIVERY_THRESHOLD = 2500;
export const DELIVERY_FEE = 99;

// Delivery goes by the goods (with any GST) before a coupon, so a coupon never brings back the fee.
export const deliveryFeeFor = (goods: number): number => (goods >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

// Nothing below the coupon's minimum order; otherwise a percentage rounded down and capped at
// maxDiscount, or a flat amount, never more than the subtotal.
export const discountFor = (coupon: Coupon, subtotal: number): number => {
  if (subtotal < coupon.minSubtotal) return 0;
  const off = coupon.kind === 'percent' ? Math.floor((subtotal * coupon.amount) / 100) : coupon.amount;
  return Math.min(off, coupon.maxDiscount ?? off, subtotal);
};

// The GST on an amount before tax at `rate` percent, to the nearest rupee.
export const gstFor = (amount: number, rate: number): number => Math.round((amount * rate) / 100);

// A cart line as it would be ordered: retail at the product's price, which includes GST, or in bulk at the bulk
// price with GST on top. A bulk line whose product no longer sells in bulk goes back to retail.
export const priceLine = (product: Product, quantity: number, bulk = false): CartItem =>
  bulk && product.bulk
    ? { product, quantity, bulk: true, price: product.bulk.price, gst: gstFor(product.bulk.price * quantity, product.bulk.gstRate) }
    : { product, quantity, bulk: false, price: product.price, gst: 0 };

// What a line comes to: its packs, and the GST on a bulk line.
export const lineTotal = ({ price, quantity, gst }: Pick<CartItem, 'price' | 'quantity' | 'gst'>): number => price * quantity + gst;

// What the cart comes to before a coupon. Coupons are for the retail items only (retailSubtotal): bulk prices are
// already the wholesale rate.
export type CartTotals = { count: number; subtotal: number; retailSubtotal: number; gst: number; deliveryFee: number; total: number };

export const cartTotals = (cart: CartItem[]): CartTotals => {
  const sum = (items: CartItem[], amount: (item: CartItem) => number): number => items.reduce((total: number, item: CartItem) => total + amount(item), 0);
  const subtotal = sum(cart, (item: CartItem) => item.price * item.quantity);
  const gst = sum(cart, (item: CartItem) => item.gst);
  const deliveryFee = deliveryFeeFor(subtotal + gst);
  return {
    count: sum(cart, (item: CartItem) => item.quantity),
    subtotal,
    retailSubtotal: sum(cart.filter((item: CartItem) => !item.bulk), (item: CartItem) => item.price * item.quantity),
    gst,
    deliveryFee,
    total: subtotal + gst + deliveryFee,
  };
};

export const formatPrice = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

// What one piece of a pack costs, as wholesale buyers compare rates: "₹6/piece" for a 'Box of 100' at ₹600,
// "₹24/pair" for a 'Box of 50 pairs'. Null when the unit isn't a count of more than one.
export const perItemPrice = ({ price, unit }: { price: number; unit: string }): string | null => {
  const match = /\bof (\d+)(?: ([a-z]+?)s?)?$/i.exec(unit);
  const count = match ? Number(match[1]) : 1;
  if (!match || count <= 1) return null;
  const each = price / count;
  const amount = Number.isInteger(each) ? each.toLocaleString('en-IN') : each.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₹${amount}/${match[2]?.toLowerCase() ?? 'piece'}`;
};

// For example "10% off your first order, up to ₹250" or "₹100 off orders of ₹1,000 or more".
export const describeCoupon = ({ kind, amount, maxDiscount, minSubtotal, firstOrderOnly }: Coupon): string => {
  const off = kind === 'percent' ? `${amount}% off` : `${formatPrice(amount)} off`;
  const minimum = minSubtotal > 0 ? ` of ${formatPrice(minSubtotal)} or more` : '';
  const on = firstOrderOnly ? `your first order${minimum}` : minimum ? `orders${minimum}` : 'your order';
  return `${off} ${on}${maxDiscount ? `, up to ${formatPrice(maxDiscount)}` : ''}`;
};
