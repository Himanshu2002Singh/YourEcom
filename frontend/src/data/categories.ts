// The store's own categories, in the order the storefront shows them (syringes, the client's main line, first;
// the non-medical party and toy syringes last), each with the client's photo that stands for it. The store lists
// whichever categories have products, so a category an admin adds with a product shows too, before the
// non-medical one, with its first product's photo (lib/catalogue.ts).
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

export const categoryImages: Partial<Record<string, string>> = {
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
