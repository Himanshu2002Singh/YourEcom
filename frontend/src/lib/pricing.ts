export const FREE_DELIVERY_THRESHOLD = 2500;
export const DELIVERY_FEE = 99;

export const deliveryFeeFor = (subtotal: number): number => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

export const formatPrice = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;
