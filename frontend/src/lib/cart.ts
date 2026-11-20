import type { CartLine } from '@/types/store';

export const MAX_QUANTITY = 999;

// Sets a product's quantity in the cart: 0 removes the line, anything above MAX_QUANTITY is capped. `bulk` says
// whether it is a bulk order; left out, the line stays as it is.
export const setLineQuantity = (lines: CartLine[], id: number, quantity: number, bulk?: boolean): CartLine[] => {
  const next = Math.min(Math.max(Math.floor(quantity), 0), MAX_QUANTITY);
  if (next === 0) return lines.filter((line: CartLine) => line.id !== id);
  const current = lines.find((line: CartLine) => line.id === id);
  const updated: CartLine = (bulk ?? current?.bulk) ? { id, quantity: next, bulk: true } : { id, quantity: next };
  return current ? lines.map((line: CartLine) => (line.id === id ? updated : line)) : [...lines, updated];
};

// Adds packs of a product. Each product is in the cart once, so adding it the other way (bulk instead of retail,
// or back) changes the line over to the quantity just added.
export const addToLines = (lines: CartLine[], id: number, quantity: number, bulk = false): CartLine[] => {
  const current = lines.find((line: CartLine) => line.id === id);
  const kept = current && Boolean(current.bulk) === bulk ? current.quantity : 0;
  return setLineQuantity(lines, id, kept + quantity, bulk);
};
