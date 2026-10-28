import type { categories } from '@/data/products';

export type Category = (typeof categories)[number];

export type Product = {
  id: number;
  name: string;
  category: Category;
  price: number;
  unit: string;
  badge?: string;
  image: string;
  description: string;
  features: string[];
};

export type CartLine = { id: number; quantity: number };
export type CartItem = Product & { quantity: number };

export type User = {
  name: string;
  email: string;
  memberSince: number;
  preferences: { smsUpdates: boolean; offers: boolean };
};

export type DeliveryDetails = { name: string; phone: string; address: string; city: string; pincode: string };
export type PaymentMethod = 'online' | 'cod';
export type OrderStatus = 'Processing' | 'Delivered';

export type Order = {
  id: string;
  email: string;
  placedAt: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  delivery: DeliveryDetails;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
};
