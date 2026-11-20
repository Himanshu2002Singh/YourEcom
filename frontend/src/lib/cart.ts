import type { CartLine } from '@/types/store';

export const MAX_QUANTITY = 999; // packs on a retail line
// A bulk line has no limit but the stock, which never goes above this (backend/validators/order.validator.js).
export const MAX_BULK_QUANTITY = 1_000_000;

// Sets a product's quantity in the cart: 0 removes the line, anything above the line's limit is capped. `bulk`
// says whether it is a bulk order; left out, the line stays as it is.
export const setLineQuantity = (lines: CartLine[], id: number, quantity: number, bulk?: boolean): CartLine[] => {
  const current = lines.find((line: CartLine) => line.id === id);
  const isBulk = bulk ?? Boolean(current?.bulk);
  const next = Math.min(Math.max(Math.floor(quantity), 0), isBulk ? MAX_BULK_QUANTITY : MAX_QUANTITY);
  if (next === 0) return lines.filter((line: CartLine) => line.id !== id);
  const updated: CartLine = isBulk ? { id, quantity: next, bulk: true } : { id, quantity: next };
  return current ? lines.map((line: CartLine) => (line.id === id ? updated : line)) : [...lines, updated];
};

// Adds packs of a product. Each product is in the cart once, so adding it the other way (bulk instead of retail,
// or back) changes the line over to the quantity just added.
export const addToLines = (lines: CartLine[], id: number, quantity: number, bulk = false): CartLine[] => {
  const current = lines.find((line: CartLine) => line.id === id);
  const kept = current && Boolean(current.bulk) === bulk ? current.quantity : 0;
  return setLineQuantity(lines, id, kept + quantity, bulk);
};
