// A product shaped like the storefront's Product (frontend/src/types/store.ts):
// `badge` is left out when the product has none, and `family` and `variant` when it comes in one size.
// `mrp` is null when unknown. `stock` is how many can still be ordered.
// `rating` is the average star rating (null before the first review).
export function productView(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    ...(row.family ? { family: row.family, variant: row.variant } : {}),
    price: row.price,
    mrp: row.mrp,
    unit: row.unit,
    stock: row.stock,
    ...(row.badge ? { badge: row.badge } : {}),
    image: row.image,
    gallery: row.gallery ?? [],
    description: row.description,
    features: row.features,
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: Number(row.review_count),
  };
}
