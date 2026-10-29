import type { Coupon } from '@/types/store';

// The same rules as backend/services/pricing.service.js, which has the final say on every order.
export const FREE_DELIVERY_THRESHOLD = 2500;
export const DELIVERY_FEE = 99;

// Delivery goes by the subtotal before any coupon, so a coupon never brings back the fee.
export const deliveryFeeFor = (subtotal: number): number => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

// Nothing below the coupon's minimum order; otherwise a percentage rounded down and capped at
// maxDiscount, or a flat amount, never more than the subtotal.
export const discountFor = (coupon: Coupon, subtotal: number): number => {
  if (subtotal < coupon.minSubtotal) return 0;
  const off = coupon.kind === 'percent' ? Math.floor((subtotal * coupon.amount) / 100) : coupon.amount;
  return Math.min(off, coupon.maxDiscount ?? off, subtotal);
};

export const formatPrice = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

// For example "10% off your first order, up to ₹250" or "₹100 off orders of ₹1,000 or more".
export const describeCoupon = ({ kind, amount, maxDiscount, minSubtotal, firstOrderOnly }: Coupon): string => {
  const off = kind === 'percent' ? `${amount}% off` : `${formatPrice(amount)} off`;
  const minimum = minSubtotal > 0 ? ` of ${formatPrice(minSubtotal)} or more` : '';
  const on = firstOrderOnly ? `your first order${minimum}` : minimum ? `orders${minimum}` : 'your order';
  return `${off} ${on}${maxDiscount ? `, up to ${formatPrice(maxDiscount)}` : ''}`;
};
