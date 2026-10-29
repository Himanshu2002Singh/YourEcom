import type { OrderStatus, PaymentMethod } from '@/types/store';

// How dates and order details are written out for customers.
export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const paymentLabels: Record<PaymentMethod, string> = { online: 'Card / UPI', cod: 'Cash on delivery' };

export const deliveryLabels: Record<OrderStatus, string> = {
  Processing: 'Delivering to',
  Delivered: 'Delivered to',
  Cancelled: 'Was to be delivered to',
};
