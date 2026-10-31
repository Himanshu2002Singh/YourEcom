import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, ShoppingCart, Truck } from 'lucide-react';
import { ProductReviews } from '@/components/ProductReviews';
import { QuantityStepper } from '@/components/QuantityStepper';
import { ProductCard, RatingSummary, SaveButton, StockNote, WhatsAppIcon, type ShopActions } from '@/components/StoreShared';
import { whatsAppLink } from '@/data/contact';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatPrice } from '@/lib/pricing';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { Product, User } from '@/types/store';

type ProductPageProps = ShopActions & {
  products: Product[]; // the catalogue from the API
  openCart: () => void;
  user: User | null | undefined; // undefined while the session is checked
  reloadProducts: () => void;
};

export function ProductPage({ products, openCart, user, reloadProducts, ...shop }: ProductPageProps) {
  const { quantityOf, addToCart, setQuantity, isSaved, toggleSaved } = shop;
  const { id } = useParams();
  const product = products.find((item: Product) => item.id === Number(id));
  usePageTitle(product?.name ?? 'Page not found');

  if (!product) return <NotFoundPage />;
  const quantity = quantityOf(product.id);
  // Other sizes of the same thing first (the rest of the syringe range), otherwise anything else.
  const others = products.filter((item: Product) => item.id !== product.id);
  const sameCategory = others.filter((item: Product) => item.category === product.category);
  const related = (sameCategory.length > 0 ? sameCategory : others).slice(0, 4);
  const bulkMessage = `Hello YourEcom, please share your bulk rate for ${product.name} (${product.unit}). Quantity I need: `;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link to="/#products" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand">
        <ArrowLeft size={17} /> Back to products
      </Link>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
          <img src={product.image} alt={product.name} className="h-72 w-full rounded-lg object-cover sm:h-[420px] lg:h-[500px]" />
          {product.badge && <span className="absolute left-6 top-6 rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white">{product.badge}</span>}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-leaf">{product.category}</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-4xl">{product.name}</h1>
          <a href="#reviews" className="mt-3 w-fit">
            <RatingSummary product={product} className="text-sm" />
          </a>
          <p className="mt-5 text-lg leading-8 text-slate-600">{product.description}</p>
          <ul className="my-6 grid gap-2 sm:grid-cols-3">
            {product.features.map((feature: string) => (
              <li key={feature} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-navy">
                <Check size={17} className="mt-0.5 shrink-0 text-leaf" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="border-y border-slate-200 py-5">
            <p className="text-3xl font-bold text-navy">{formatPrice(product.price)}</p>
            <p className="text-sm text-slate-500">{product.unit} · Inclusive of taxes</p>
            <StockNote stock={product.stock} className="mt-2 text-sm" />
            {quantity > 0 && (
              <p className="mt-2 text-sm font-semibold text-brand">
                {quantity} in your cart · {formatPrice(product.price * quantity)}
              </p>
            )}
          </div>
          {quantity === 0 ? (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="flex h-14 flex-1 items-center justify-center gap-3 rounded-lg bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:bg-slate-200 disabled:text-slate-500"
              >
                <ShoppingCart size={19} /> {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
              </button>
              <SaveButton product={product} saved={isSaved(product.id)} toggleSaved={toggleSaved} large />
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantityStepper quantity={quantity} onChange={(next: number) => setQuantity(product.id, next)} label={product.name} max={product.stock} size="lg" />
              <button
                onClick={openCart}
                className="flex h-14 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border-2 border-brand px-6 font-semibold text-brand transition hover:bg-brand-soft"
              >
                <ShoppingCart size={19} /> View cart
              </button>
              <SaveButton product={product} saved={isSaved(product.id)} toggleSaved={toggleSaved} large />
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <Truck size={17} className="text-brand" /> Wholesale and retail orders
            </span>
            <a href={whatsAppLink(bulkMessage)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand hover:underline">
              <WhatsAppIcon size={17} className="text-whatsapp" /> Bulk rate on WhatsApp
            </a>
          </div>
        </div>
      </div>
      <ProductReviews product={product} user={user} onSaved={reloadProducts} />
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-navy sm:text-3xl">{sameCategory.length > 0 ? `More in ${product.category}` : 'You may also need'}</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {related.map((item: Product) => (
            <ProductCard key={item.id} product={item} {...shop} />
          ))}
        </div>
      </section>
    </main>
  );
}
