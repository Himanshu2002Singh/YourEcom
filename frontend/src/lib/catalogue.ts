import type { Category, Product, StoreInfo } from '@/types/store';

// The sizes of one product (a family), or a product that comes in one size, in catalogue order.
export type ProductGroup = Product[];

// The number a variant starts with ('14G (Orange)' → 14, '12.5 mm × 9 m' → 12.5), or null for 'Blue'.
const leadingNumber = (variant?: string | null): number | null => {
  const match = /\d+(\.\d+)?/.exec(variant ?? '');
  return match ? Number(match[0]) : null;
};

// Products grouped by family, in the order each family first appears, so the storefront shows one card
// per product with its sizes to choose from. Sizes run smallest first, whatever order they were added in.
export const groupByFamily = (products: Product[]): ProductGroup[] => {
  const groups = new Map<string, ProductGroup>();
  for (const product of products) {
    const key = product.family ?? `#${product.id}`;
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  return [...groups.values()].map((group: ProductGroup) =>
    group.every((product: Product) => leadingNumber(product.variant) !== null)
      ? [...group].sort((a: Product, b: Product) => (leadingNumber(a.variant) ?? 0) - (leadingNumber(b.variant) ?? 0))
      : group,
  );
};

// A product's name without its size: 'Disposable Syringe without Needle' for any of its sizes.
export const groupName = (product: Product): string => product.family ?? product.name;

// What the sizes differ by: sizes ('2 ml', '22G') have numbers; other options ('Blue', 'Non-woven', 'Class 2') are types.
export const variantLabel = (group: ProductGroup): string =>
  group.some((product: Product) => /\d/.test(product.variant ?? '') && !/^class\b/i.test(product.variant ?? '')) ? 'Size' : 'Type';

// "6 sizes: 2 ml – 50 ml" or "2 types: Blue, Black".
export const variantSummary = (group: ProductGroup): string => {
  const variants = group.map((product: Product) => product.variant ?? '');
  const label = variantLabel(group).toLowerCase();
  const range = label === 'size' ? `${variants[0]} – ${variants[variants.length - 1]}` : variants.join(', ');
  return `${group.length} ${label}s: ${range}`;
};

// The whole-number percentage off the MRP, or 0 when there is no MRP above the price.
export const discountOf = ({ price, mrp }: Pick<Product, 'price' | 'mrp'>): number => (mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const categoryPath = (category: Category): string => `/products?category=${encodeURIComponent(category)}`;

// The store's own categories, from GET /api/store (hooks/useStoreInfo.ts).
type StoreCategories = Pick<StoreInfo, 'categories' | 'nonMedicalCategory'>;

// Store order of categories: as the store lists them, with any an admin added (A to Z) after the medical ones
// and before the non-medical one.
export const byCategoryOrder = ({ categories, nonMedicalCategory }: StoreCategories): ((a: Category, b: Category) => number) => {
  const listed = categories.map(({ name }) => name);
  const rank = (category: Category): number => (listed.includes(category) ? listed.indexOf(category) : listed.indexOf(nonMedicalCategory) - 0.5);
  return (a: Category, b: Category): number => rank(a) - rank(b) || a.localeCompare(b);
};

// Store order of products: by category (syringes first), then catalogue order.
export const byCategory = (store: StoreCategories): ((a: Product, b: Product) => number) => {
  const order = byCategoryOrder(store);
  return (a: Product, b: Product): number => order(a.category, b.category);
};

// The categories that have products, in store order. Until the catalogue loads, the store's own.
export const storeCategories = (products: Product[] | null, store: StoreCategories): Category[] =>
  products ? [...new Set(products.map((product: Product) => product.category))].sort(byCategoryOrder(store)) : store.categories.map(({ name }) => name);

// A category's picture: the one chosen for it or, for one an admin added, its first product's main photo.
export const categoryImage = (category: Category, products: Product[] | null, store: StoreCategories): string | undefined =>
  store.categories.find(({ name }) => name === category)?.image ?? products?.find((product: Product) => product.category === category)?.image;

// Whether `query` (already lower case) appears in anything a customer would search by.
export const matchesSearch = (product: Product, query: string): boolean =>
  query === '' || [product.name, product.category, product.description, ...product.features].some((text: string) => text.toLowerCase().includes(query));
