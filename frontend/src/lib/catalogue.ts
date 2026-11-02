import { categories } from '@/data/categories';
import type { Category, Product } from '@/types/store';

// The sizes of one product (a family), or a product that comes in one size, in catalogue order.
export type ProductGroup = Product[];

// Products grouped by family, in the order each family first appears, so the storefront shows one card
// per product with its sizes to choose from.
export const groupByFamily = (products: Product[]): ProductGroup[] => {
  const groups = new Map<string, ProductGroup>();
  for (const product of products) {
    const key = product.family ?? `#${product.id}`;
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  return [...groups.values()];
};

// A product's name without its size: 'Disposable Syringe without Needle' for any of its sizes.
export const groupName = (product: Product): string => product.family ?? product.name;

// What the sizes differ by: sizes ('2 ml', '22G') have numbers, other options ('Blue', 'Non-woven') are types.
export const variantLabel = (group: ProductGroup): string => (group.some((product: Product) => /\d/.test(product.variant ?? '')) ? 'Size' : 'Type');

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

// Store order: by category (syringes first), then catalogue order.
export const byCategory = (a: Product, b: Product): number => categories.indexOf(a.category) - categories.indexOf(b.category);

// Whether `query` (already lower case) appears in anything a customer would search by.
export const matchesSearch = (product: Product, query: string): boolean =>
  query === '' || [product.name, product.category, product.description, ...product.features].some((text: string) => text.toLowerCase().includes(query));
