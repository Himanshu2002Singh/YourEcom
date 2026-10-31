import { Link } from 'react-router';
import { Heart } from 'lucide-react';
import { ProductCard, type ShopActions } from '@/components/StoreShared';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Product } from '@/types/store';

type WishlistPageProps = ShopActions & { products: Product[] }; // the saved products, most recently saved first

export function WishlistPage({ products, ...shop }: WishlistPageProps) {
  usePageTitle('My wishlist');

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-leaf">Your account</p>
        <h1 className="mt-2 text-4xl font-semibold text-navy">My wishlist</h1>
        <p className="mt-2 text-slate-500">Products you’ve saved for later.</p>
      </div>
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Heart size={32} className="mx-auto text-rose-500" />
          <h2 className="mt-4 text-xl font-semibold text-navy">Nothing saved yet</h2>
          <p className="mt-2 text-sm text-slate-500">Tap the heart on any product to keep it here.</p>
          <Link to="/#products" className="mt-5 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} {...shop} />
          ))}
        </div>
      )}
    </main>
  );
}
