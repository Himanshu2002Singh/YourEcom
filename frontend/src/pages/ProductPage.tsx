import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { ProductReviews } from '@/components/ProductReviews';
import { QuantityStepper } from '@/components/QuantityStepper';
import { ProductCard, RatingSummary, SaveButton, StockNote, type ShopActions } from '@/components/StoreShared';
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
  const related = products.filter((item: Product) => item.id !== product.id).slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Link to="/#products" className="mb-8 inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 transition hover:text-[#0b6fce]">
        <ArrowLeft size={17} /> Back to products
      </Link>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#eaf7ff] p-5">
          <img src={product.image} alt={product.name} className="h-72 w-full rounded-[1.5rem] object-cover sm:h-[420px] lg:h-[540px]" />
          {product.badge && <span className="absolute left-10 top-10 rounded-full bg-[#c9f23b] px-4 py-2 text-xs font-black uppercase text-[#082b62]">{product.badge}</span>}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">{product.category}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] text-[#082b62] sm:text-5xl">{product.name}</h1>
          <a href="#reviews" className="mt-3 w-fit">
            <RatingSummary product={product} className="text-sm" />
          </a>
          <p className="mt-6 text-lg leading-8 text-slate-600">{product.description}</p>
          <div className="my-7 grid gap-3 sm:grid-cols-3">
            {product.features.map((feature: string) => (
              <div key={feature} className="rounded-2xl border border-slate-100 bg-white p-3 text-sm font-bold text-[#082b62] shadow-sm">
                <Check size={17} className="mb-2 text-[#159a7a]" />
                {feature}
              </div>
            ))}
          </div>
          <div className="border-y border-slate-100 py-6">
            <p className="text-3xl font-black text-[#082b62]">{formatPrice(product.price)}</p>
            <p className="text-sm font-semibold text-slate-400">{product.unit} · Inclusive of taxes</p>
            <StockNote stock={product.stock} className="mt-2 text-sm" />
            {quantity > 0 && (
              <p className="mt-2 text-sm font-bold text-[#0b6fce]">
                {quantity} in your cart · {formatPrice(product.price * quantity)}
              </p>
            )}
          </div>
          {quantity === 0 ? (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="flex h-14 flex-1 items-center justify-center gap-3 rounded-full bg-[#0b6fce] font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-[#082b62] disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
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
                className="flex h-14 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[#0b6fce] px-6 font-extrabold text-[#0b6fce] transition hover:bg-sky-50"
              >
                <ShoppingCart size={19} /> View cart
              </button>
              <SaveButton product={product} saved={isSaved(product.id)} toggleSaved={toggleSaved} large />
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-bold text-slate-500">
            <span className="flex items-center gap-2">
              <Truck size={17} className="text-[#0b6fce]" /> Ships in 1–2 days
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#159a7a]" /> Quality guaranteed
            </span>
          </div>
        </div>
      </div>
      <ProductReviews product={product} user={user} onSaved={reloadProducts} />
      <section className="mt-16">
        <h2 className="text-2xl font-black tracking-tight text-[#082b62] sm:text-3xl">You may also need</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item: Product) => (
            <ProductCard key={item.id} product={item} {...shop} />
          ))}
        </div>
      </section>
    </main>
  );
}
