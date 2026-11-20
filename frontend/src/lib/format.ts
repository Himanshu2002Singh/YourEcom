import type { OrderStatus, PaymentStatus } from '@/types/store';

// How dates and order details are written out for customers.
export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const paymentStatusLabels: Record<PaymentStatus, string> = { cod: 'Cash on delivery', pending: 'Awaiting payment', paid: 'Paid online' };

export const deliveryLabels: Record<OrderStatus, string> = {
  Processing: 'Delivering to',
  Shipped: 'On its way to',
  Delivered: 'Delivered to',
  Cancelled: 'Was to be delivered to',
};
