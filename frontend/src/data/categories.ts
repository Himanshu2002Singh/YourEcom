// The store's categories, in the order the storefront shows them (syringes, the client's main line, first),
// each with the client's photo that stands for it. The products themselves come from the API; the backend
// accepts the same category names (backend/validators/product.validator.js).
export const categories = ['Syringes', 'IV Cannula', 'IV Sets', 'Gloves', 'Face Masks', 'Caps & Shoe Covers', 'Bandages & Gauze', 'Lab Disposables'] as const;

export const categoryImages: Record<(typeof categories)[number], string> = {
  Syringes: '/photos/syringe-without-needle.jpg',
  'IV Cannula': '/photos/iv-cannula.jpg',
  'IV Sets': '/photos/scalp-vein-set.jpg',
  Gloves: '/photos/gloves-latex-nitrile.jpg',
  'Face Masks': '/photos/mask-isi-class2.jpg',
  'Caps & Shoe Covers': '/photos/shoe-covers.jpg',
  'Bandages & Gauze': '/photos/gauze-roller-bandage.jpg',
  'Lab Disposables': '/photos/edta-tubes.jpg',
};
