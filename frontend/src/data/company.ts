import { Leaf, PawPrint, Rocket, type LucideIcon } from 'lucide-react';

// Who YourEcom is, in the client's own words (their message of 2026-11-03).
export const ABOUT_TEXT =
  'Founded in 2024, YourEcom is a leading wholesaler and supplier of premium surgical disposable products. Our mission is to support healthcare professionals with reliable and high-quality disposable items that are essential for maintaining hygiene and safety in medical settings. We take pride in our commitment to excellence, ensuring that all our products meet the rigorous standards of the healthcare industry.';

// How the client describes their trade on their posters.
export const SUPPLY_TYPES = ['Wholesale', 'Retail', 'Government supply', 'Local supply'] as const;

// A logo's path, or an icon of the buyer's work for the few with no logo to be found.
export type Logo = string | LucideIcon;

// The government buyers the client has supplied (their list of 2026-11-03): a short name for tight spaces, the
// full name, and its logo (frontend/public/logos, from Wikimedia Commons). Military Hospital shows the Army Medical
// Corps crest, and the Ministry of AYUSH the State Emblem from its own logo, whose text repeats the name. VSSC, NRIBAS
// and the veterinary services have no logo online, so they show an icon of their work. The client asked for the
// logos on 2026-11-20, knowing several crests carry the State Emblem, whose use on a business's site is restricted.
export const governmentBuyers: [short: string, full: string, logo: Logo][] = [
  ['ISRO', 'Indian Space Research Organisation (ISRO)', '/logos/isro.webp'],
  ['VSSC', 'Vikram Sarabhai Space Centre (VSSC)', Rocket],
  ['Indian Navy', 'Indian Navy', '/logos/indian-navy.webp'],
  ['Indian Air Force', 'Indian Air Force', '/logos/indian-air-force.webp'],
  ['ITBP', 'Indo-Tibetan Border Police (ITBP)', '/logos/itbp.webp'],
  ['Military Hospital', 'Military Hospital', '/logos/army-medical-corps.webp'],
  ['ESIC Hospital', 'ESIC Hospital', '/logos/esic.webp'],
  ['Ministry of AYUSH', 'Ministry of AYUSH', '/logos/ministry-of-ayush.webp'],
  ['NRIBAS', 'National Research Institute of Basic Ayurvedic Sciences (NRIBAS)', Leaf],
  ['Veterinary Services, Indravati', 'Veterinary Services, Indravati', PawPrint],
];

// The client's photos of their stock, for the About page (its banner uses /photos/stock-cartons.jpg).
export const stockPhotos: [src: string, alt: string][] = [
  ['/photos/stock-packing-room.jpg', 'Cartons and bags of syringes'],
  ['/photos/stock-syringe-bags.jpg', 'Bags of loose syringes'],
  ['/photos/stock-ivlife-pallets.jpg', 'Pallets of ivlife IV fluid cartons, 25 bottles each'],
  ['/photos/warehouse-stock.jpg', 'Medical disposables in stock'],
];
