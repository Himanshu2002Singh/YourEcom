import { useState } from 'react';
import { Link } from 'react-router';
import { Heart, LoaderCircle, ShoppingCart, Star } from 'lucide-react';
import { QuantityStepper } from '@/components/QuantityStepper';
import { discountOf, groupName, variantLabel, type ProductGroup } from '@/lib/catalogue';
import { formatPrice } from '@/lib/pricing';
import type { Product } from '@/types/store';

// What product cards and pages can do with the cart and the wishlist (App.tsx keeps both).
export type ShopActions = {
  quantityOf: (id: number) => number;
  addToCart: (product: Product) => void;
  setQuantity: (id: number, quantity: number) => void;
  isSaved: (id: number) => boolean;
  toggleSaved: (product: Product) => void;
};

// The white panels the storefront is built from, on the grey page.
export const panel = 'rounded-md bg-white shadow-sm';

const LOW_STOCK = 10;

// "Only 3 left" when stock runs low, "Out of stock" at none; nothing while there's plenty.
export function StockNote({ stock, className = '' }: { stock: number; className?: string }) {
  if (stock > LOW_STOCK) return null;
  return <p className={`text-xs font-bold ${stock === 0 ? 'text-rose-600' : 'text-amber-700'} ${className}`}>{stock === 0 ? 'Out of stock' : `Only ${stock} left`}</p>;
}

// Five stars filled to the nearest whole star of `rating`; the caller labels them.
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star: number) => (
        <Star key={star} size={size} className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
    </span>
  );
}

// [4.5 ★] (12): a green rating chip, shown once a product has its first review.
export function RatingSummary({ product, className = '' }: { product: Product; className?: string }) {
  if (product.rating === null) return null;
  const reviews = `${product.reviewCount} ${product.reviewCount === 1 ? 'review' : 'reviews'}`;
  return (
    <p role="img" aria-label={`Rated ${product.rating} out of 5 from ${reviews}`} className={`flex items-center gap-1.5 text-xs font-medium text-slate-500 ${className}`}>
      <span aria-hidden="true" className="inline-flex items-center gap-0.5 rounded bg-deal px-1.5 py-0.5 font-bold text-white">
        {product.rating.toFixed(1)} <Star size={10} className="fill-current" />
      </span>
      <span aria-hidden="true">({product.reviewCount})</span>
    </p>
  );
}

// ₹280 ₹̶5̶0̶0̶ 44% off: the price, with the MRP struck through and the saving when there is one.
export function Price({ product, large, className = '' }: { product: Pick<Product, 'price' | 'mrp'>; large?: boolean; className?: string }) {
  const off = discountOf(product);
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className={`font-bold text-slate-900 ${large ? 'text-3xl' : 'text-lg'}`}>{formatPrice(product.price)}</span>
      {off > 0 && (
        <>
          <span className={`text-slate-500 line-through ${large ? 'text-base' : 'text-sm'}`}>
            <span className="sr-only">MRP </span>
            {formatPrice(product.mrp ?? product.price)}
          </span>
          <span className={`font-bold text-deal ${large ? 'text-base' : 'text-sm'}`}>{off}% off</span>
        </>
      )}
    </p>
  );
}

// The heart that saves a product to the wishlist, or takes it off again.
export function SaveButton({ product, saved, toggleSaved }: { product: Product; saved: boolean; toggleSaved: (product: Product) => void }) {
  return (
    <button
      type="button"
      onClick={() => toggleSaved(product)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white shadow-md transition hover:scale-105 ${saved ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
    >
      <Heart size={17} className={saved ? 'fill-current' : ''} />
    </button>
  );
}

// The yellow "Add to cart" button, or the quantity stepper once the product is in the cart.
export function AddToCart({ product, quantityOf, addToCart, setQuantity }: Pick<ShopActions, 'quantityOf' | 'addToCart' | 'setQuantity'> & { product: Product }) {
  const quantity = quantityOf(product.id);
  if (quantity > 0) {
    return (
      <div className="flex items-center justify-between gap-2">
        <QuantityStepper quantity={quantity} onChange={(next: number) => setQuantity(product.id, next)} label={product.name} max={product.stock} />
        <span className="text-xs font-bold text-deal">In cart</span>
      </div>
    );
  }
  if (product.stock === 0) return <p className="flex h-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-500">Out of stock</p>;
  return (
    <button
      onClick={() => addToCart(product)}
      aria-label={`Add ${product.name} to cart`}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-cart text-sm font-bold text-slate-900 shadow-sm transition hover:bg-cart-dark"
    >
      <ShoppingCart size={16} /> Add to cart
    </button>
  );
}

// One product on a shelf. A product that comes in sizes gets a dropdown to pick one; the price, stock and
// "Add to cart" follow the chosen size.
export function ProductCard({ group, isSaved, toggleSaved, ...cart }: ShopActions & { group: ProductGroup }) {
  const [chosenId, setChosenId] = useState(group[0].id);
  const product = group.find((item: Product) => item.id === chosenId) ?? group[0];
  const productPath = `/product/${product.id}`;
  return (
    <article className="relative flex h-full flex-col rounded-md border border-slate-200 bg-white p-3 transition hover:shadow-lg">
      <Link to={productPath} tabIndex={-1} aria-hidden="true" className="group block aspect-square overflow-hidden rounded bg-slate-50">
        <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </Link>
      {product.badge && <span className="absolute left-3 top-6 rounded-r bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">{product.badge}</span>}
      <div className="absolute right-5 top-5">
        <SaveButton product={product} saved={isSaved(product.id)} toggleSaved={toggleSaved} />
      </div>
      <Link to={productPath} className="mt-3 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-slate-800 transition hover:text-brand">
        {group.length > 1 ? groupName(product) : product.name}
      </Link>
      <RatingSummary product={product} className="mt-2" />
      <Price product={product} className="mt-2" />
      <p className="text-xs text-slate-500">{product.unit}</p>
      <StockNote stock={product.stock} className="mt-1" />
      {group.length > 1 && (
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          {variantLabel(group)}
          <select
            value={product.id}
            onChange={(event) => setChosenId(Number(event.target.value))}
            className="h-8 min-w-0 flex-1 cursor-pointer rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 outline-none focus:border-brand"
          >
            {group.map((item: Product) => (
              <option key={item.id} value={item.id}>
                {item.variant}
                {item.stock === 0 ? ' (out of stock)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="mt-auto pt-3">
        <AddToCart product={product} {...cart} />
      </div>
    </article>
  );
}

// Shown while something waits for the API.
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-3 py-16 font-bold text-slate-500">
      <LoaderCircle size={22} className="animate-spin text-brand" /> {label}
    </p>
  );
}

// Shown when the API couldn't answer, with a way to try again.
export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-md bg-white p-12 text-center text-slate-500">
      <p>{message}</p>
      <button onClick={retry} className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark">
        Try again
      </button>
    </div>
  );
}

// WhatsApp's logo (lucide has no brand icons).
export function WhatsAppIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={`shrink-0 ${className ?? ''}`}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.83 9.83 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z" />
    </svg>
  );
}
