// Who YourEcom is, in the client's own words (their message of 2026-11-03).
export const ABOUT_TEXT =
  'Founded in 2024, YourEcom is a leading wholesaler and supplier of premium surgical disposable products. Our mission is to support healthcare professionals with reliable and high-quality disposable items that are essential for maintaining hygiene and safety in medical settings. We take pride in our commitment to excellence, ensuring that all our products meet the rigorous standards of the healthcare industry.';

// How the client describes their trade on their posters.
export const SUPPLY_TYPES = ['Wholesale', 'Retail', 'Government supply', 'Local supply'] as const;

// The government buyers the client has supplied (their list of 2026-11-03), as a short name for tight spaces
// and the full name. Names only: these bodies' crests and emblems may not be used to suggest they endorse a supplier.
export const governmentBuyers: [short: string, full: string][] = [
  ['ISRO', 'Indian Space Research Organisation (ISRO)'],
  ['VSSC', 'Vikram Sarabhai Space Centre (VSSC)'],
  ['Indian Navy', 'Indian Navy'],
  ['Indian Air Force', 'Indian Air Force'],
  ['ITBP', 'Indo-Tibetan Border Police (ITBP)'],
  ['Military Hospital', 'Military Hospital'],
  ['ESIC Hospital', 'ESIC Hospital'],
  ['Ministry of AYUSH', 'Ministry of AYUSH'],
  ['NRIBAS', 'National Research Institute of Basic Ayurvedic Sciences (NRIBAS)'],
  ['Veterinary Services, Indravati', 'Veterinary Services, Indravati'],
];

// The client's photos of their stock, for the About page (its banner uses /photos/stock-cartons.jpg).
export const stockPhotos: [src: string, alt: string][] = [
  ['/photos/stock-packing-room.jpg', 'Cartons and bags of syringes'],
  ['/photos/stock-syringe-bags.jpg', 'Bags of loose syringes'],
  ['/photos/stock-ivlife-pallets.jpg', 'Pallets of ivlife IV fluid cartons, 25 bottles each'],
  ['/photos/warehouse-stock.jpg', 'Medical disposables in stock'],
];
