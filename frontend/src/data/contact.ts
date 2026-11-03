// How customers reach YourEcom, as printed on the client's posters and business card. The phone number is the
// one the client gave on 2026-11-03 in place of the poster's; it is also the WhatsApp number.
export const PHONE = '+91 70005 90408';
export const PHONE_LINK = 'tel:+917000590408';
export const EMAIL = 'yourecom69@gmail.com';
export const ADDRESS = ['26-27, Block R3-B, Mohan Garden', 'Uttam Nagar, New Delhi 110059'];
export const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`YourEcom, ${ADDRESS.join(', ')}`)}`;

// From the client's IndiaMART profile, for buyers who check a supplier's registration.
export const GSTIN = '07AZMPR3055K1ZV';
export const INDIAMART_LINK = 'https://www.indiamart.com/yourecom/';

// Opens a WhatsApp chat with the business with `message` already typed in.
export const whatsAppLink = (message = 'Hello YourEcom, I would like to know more about your products.'): string =>
  `https://wa.me/917000590408?text=${encodeURIComponent(message)}`;
