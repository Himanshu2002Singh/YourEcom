// How customers reach YourEcom, as printed on the client's posters.
export const PHONE = '+91 96438 21551';
export const PHONE_LINK = 'tel:+919643821551';
export const ADDRESS = ['26-27, Block R3-B, Mohan Garden', 'Uttam Nagar, New Delhi 110059'];
export const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`YourEcom, ${ADDRESS.join(', ')}`)}`;

// Opens a WhatsApp chat with the business with `message` already typed in.
export const whatsAppLink = (message = 'Hello YourEcom, I would like to know more about your products.'): string =>
  `https://wa.me/919643821551?text=${encodeURIComponent(message)}`;
