import { createContext, useContext } from 'react';
import type { StoreInfo } from '@/types/store';

// The store's own details from GET /api/store. App loads them once and renders no page until they have loaded,
// so every page can read them.
export const StoreInfoContext = createContext<StoreInfo | null>(null);

export function useStoreInfo(): StoreInfo {
  const info = useContext(StoreInfoContext);
  if (!info) throw new Error('useStoreInfo is only for pages inside StoreInfoContext, which App provides once /store loads.');
  return info;
}

// The store's address on Google Maps.
export const mapLink = ({ address }: StoreInfo): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`YourEcom, ${address.join(', ')}`)}`;

// Opens a WhatsApp chat with the business with `message` already typed in.
export const whatsAppLink = ({ whatsappNumber }: StoreInfo, message = 'Hello YourEcom, I would like to know more about your products.'): string =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
