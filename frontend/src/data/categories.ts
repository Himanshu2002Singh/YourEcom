// The store's categories, in the order the storefront shows them (syringes, the client's main line, first;
// the non-medical party and toy syringes last), each with the client's photo that stands for it. The products
// themselves come from the API; the backend accepts the same category names (backend/validators/product.validator.js).
export const categories = [
  'Syringes',
  'IV Cannula',
  'IV Sets',
  'IV Fluids',
  'Gloves',
  'Face Masks',
  'Caps & Shoe Covers',
  'Bandages & Gauze',
  'Surgical Tapes',
  'Lab Disposables',
  'Toys & Party Syringes',
] as const;

export const categoryImages: Record<(typeof categories)[number], string> = {
  Syringes: '/photos/syringe-without-needle.jpg',
  'IV Cannula': '/photos/iv-cannula.jpg',
  'IV Sets': '/photos/scalp-vein-set.jpg',
  'IV Fluids': '/photos/iv-fluids-ivlife.jpg',
  Gloves: '/photos/gloves-latex-nitrile.jpg',
  'Face Masks': '/photos/mask-cap-mannequin.jpg',
  'Caps & Shoe Covers': '/photos/shoe-covers.jpg',
  'Bandages & Gauze': '/photos/crepe-bandage.jpg',
  'Surgical Tapes': '/photos/micropore-tape.jpg',
  'Lab Disposables': '/photos/tube-k3-edta.jpg',
  'Toys & Party Syringes': '/photos/doctor-play-set-square.jpg',
};

// The one category that isn't medical: its products say so wherever they're shown.
export const NON_MEDICAL_CATEGORY = 'Toys & Party Syringes' satisfies (typeof categories)[number];
