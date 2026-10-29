import type { CartLine } from '@/types/store';

export const MAX_QUANTITY = 999;

// Sets a product's quantity in the cart: 0 removes the line, anything above MAX_QUANTITY is capped.
export const setLineQuantity = (lines: CartLine[], id: number, quantity: number): CartLine[] => {
  const next = Math.min(Math.max(Math.floor(quantity), 0), MAX_QUANTITY);
  if (next === 0) return lines.filter((line: CartLine) => line.id !== id);
  return lines.some((line: CartLine) => line.id === id)
    ? lines.map((line: CartLine) => (line.id === id ? { ...line, quantity: next } : line))
    : [...lines, { id, quantity: next }];
};

export const addToLines = (lines: CartLine[], id: number, quantity: number): CartLine[] =>
  setLineQuantity(lines, id, (lines.find((line: CartLine) => line.id === id)?.quantity ?? 0) + quantity);
