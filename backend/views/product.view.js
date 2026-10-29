// A product shaped like the storefront's Product (frontend/src/types/store.ts):
// `badge` is left out when the product has none. `stock` is how many can still be ordered.
// `rating` is the average star rating (null before the first review).
export function productView(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    unit: row.unit,
    stock: row.stock,
    ...(row.badge ? { badge: row.badge } : {}),
    image: row.image,
    description: row.description,
    features: row.features,
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: Number(row.review_count),
  };
}
