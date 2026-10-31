// The store's categories, in the order the home page shows them (syringes, the client's main line, first).
// The products themselves come from the API; the backend accepts the same category names
// (backend/validators/product.validator.js).
export const categories = ['Syringes', 'Needles', 'IV Sets', 'Face Masks', 'Gloves', 'Bandages', 'Gauze & Cotton'] as const;
