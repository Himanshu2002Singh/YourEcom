import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Banknote, ChevronRight, MapPin, ShoppingCart, Truck, Zap } from 'lucide-react';
import { ProductReviews } from '@/components/ProductReviews';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Price, ProductCard, RatingSummary, SaveButton, StockNote, WhatsAppIcon, panel, type ShopActions } from '@/components/StoreShared';
import { ADDRESS, PHONE, PHONE_LINK, whatsAppLink } from '@/data/contact';
import { usePageTitle } from '@/hooks/usePageTitle';
import { NO_API } from '@/lib/api';
import { categoryPath, discountOf, groupByFamily, groupName, variantLabel, type ProductGroup } from '@/lib/catalogue';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, formatPrice } from '@/lib/pricing';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { Product, User } from '@/types/store';

type ProductPageProps = ShopActions & {
  products: Product[]; // the catalogue from the API
  openCart: () => void;
  user: User | null | undefined; // undefined while the session is checked
  reloadProducts: () => void;
};

// The product's photos: thumbnails beside (or under) the large one, which shows whichever is chosen.
function Gallery({ images, name, badge }: { images: string[]; name: string; badge?: string }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 sm:flex-col">
          {images.map((src: string, index: number) => (
            <button
              key={src}
              type="button"
              onClick={() => setShown(index)}
              onMouseEnter={() => setShown(index)}
              aria-label={`Show photo ${index + 1} of ${images.length}`}
              aria-pressed={index === shown}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition ${index === shown ? 'border-brand' : 'border-slate-200 hover:border-slate-400'}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex aspect-square min-w-0 flex-1 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white">
        <img src={images[shown]} alt={name} className="h-full w-full object-contain" />
        {badge && <span className="absolute left-0 top-3 rounded-r bg-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">{badge}</span>}
      </div>
    </div>
  );
}

export function ProductPage({ products, openCart, user, reloadProducts, ...shop }: ProductPageProps) {
  const { quantityOf, addToCart, setQuantity, isSaved, toggleSaved } = shop;
  const navigate = useNavigate();
  const { id } = useParams();
  const product = products.find((item: Product) => item.id === Number(id));
  usePageTitle(product?.name ?? 'Page not found');

  if (!product) return <NotFoundPage />;
  const quantity = quantityOf(product.id);
  const soldOut = product.stock === 0;
  const sizes = product.family ? products.filter((item: Product) => item.family === product.family) : [product];
  // The rest of the category first, otherwise anything else; never this product's own sizes.
  const others = products.filter((item: Product) => groupName(item) !== groupName(product));
  const sameCategory = others.filter((item: Product) => item.category === product.category);
  const related = groupByFamily(sameCategory.length > 0 ? sameCategory : others).slice(0, 5);
  const bulkMessage = `Hello YourEcom, please share your bulk rate for ${product.name} (${product.unit}). Quantity I need: `;

  const buyNow = (): void => {
    if (quantity === 0) addToCart(product);
    navigate('/checkout');
  };

  // Add to cart and Buy now: under the photos on wide screens, under the price and sizes on phones.
  const buyButtons = (className: string) => (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={quantity === 0 ? () => addToCart(product) : openCart}
          disabled={soldOut && quantity === 0}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-cart font-bold text-slate-900 shadow-sm transition hover:bg-cart-dark disabled:bg-slate-200 disabled:text-slate-500"
        >
          <ShoppingCart size={18} /> {quantity === 0 ? 'Add to cart' : 'Go to cart'}
        </button>
        <button
          onClick={buyNow}
          disabled={soldOut && quantity === 0}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-buy font-bold text-slate-900 shadow-sm transition hover:bg-buy-dark disabled:bg-slate-200 disabled:text-slate-500"
        >
          <Zap size={18} /> Buy now
        </button>
      </div>
      {quantity > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
          <QuantityStepper quantity={quantity} onChange={(next: number) => setQuantity(product.id, next)} label={product.name} max={product.stock} />
          <p className="text-sm text-slate-600">
            In your cart: <strong className="text-slate-900">{formatPrice(product.price * quantity)}</strong>
          </p>
        </div>
      )}
    </div>
  );

  const details: [string, string][] = [
    ['Category', product.category],
    ...(product.variant ? [[variantLabel(sizes), product.variant] as [string, string]] : []),
    ['Pack', product.unit],
    ['Sold by', 'YourEcom, New Delhi'],
  ];

  return (
    <main className="mx-auto max-w-[1400px] px-2 py-3 sm:px-4">
      <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 px-1 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to={categoryPath(product.category)} className="hover:text-brand">
          {product.category}
        </Link>
        <ChevronRight size={12} />
        <span className="text-slate-700">{groupName(product)}</span>
      </nav>
      <div className={`${panel} grid gap-6 p-3 sm:p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10`}>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative">
            <Gallery key={product.id} images={[product.image, ...product.gallery]} name={product.name} badge={product.badge} />
            <div className="absolute right-3 top-3">
              <SaveButton product={product} saved={isSaved(product.id)} toggleSaved={toggleSaved} />
            </div>
          </div>
          {buyButtons('mt-4 hidden lg:block')}
        </div>

        <div className="min-w-0">
          <Link to={categoryPath(product.category)} className="text-sm font-medium text-brand hover:underline">
            {product.category}
          </Link>
          <h1 className="mt-1 text-xl font-medium leading-snug text-slate-900 sm:text-2xl">{product.name}</h1>
          <a href="#reviews" className="mt-2 inline-block">
            <RatingSummary product={product} className="text-sm" />
          </a>
          <div className="mt-4">
            {discountOf(product) > 0 && <p className="text-sm font-bold text-deal">Special price</p>}
            <Price product={product} large />
            <p className="mt-1 text-sm text-slate-500">{product.unit} · Inclusive of all taxes</p>
            <StockNote stock={product.stock} className="mt-2 text-sm" />
          </div>

          {sizes.length > 1 && (
            <div className="mt-5">
              <p className="text-sm text-slate-500">
                {variantLabel(sizes)}: <strong className="text-slate-900">{product.variant}</strong>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((size: Product) => (
                  <Link
                    key={size.id}
                    to={`/product/${size.id}`}
                    replace
                    aria-current={size.id === product.id ? 'true' : undefined}
                    className={`rounded border-2 px-3.5 py-1.5 text-sm font-medium transition ${
                      size.id === product.id ? 'border-brand bg-brand-soft text-brand' : 'border-slate-200 text-slate-700 hover:border-slate-400'
                    } ${size.stock === 0 ? 'text-slate-400 line-through' : ''}`}
                  >
                    {size.variant}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {buyButtons('mt-5 lg:hidden')}

          <ul className="mt-6 space-y-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700">
            <li className="flex gap-3">
              <Truck size={18} className="shrink-0 text-brand" />
              <span>
                <strong className="text-slate-900">Free delivery</strong> on orders of {formatPrice(FREE_DELIVERY_THRESHOLD)} or more, {formatPrice(DELIVERY_FEE)} below that.
              </span>
            </li>
            <li className="flex gap-3">
              <Banknote size={18} className="shrink-0 text-brand" />
              <span>
                <strong className="text-slate-900">Cash on delivery</strong>, or pay online by card or UPI.
              </span>
            </li>
            <li className="flex gap-3">
              <WhatsAppIcon size={18} className="text-whatsapp" />
              <span>
                <strong className="text-slate-900">Buying in bulk?</strong>{' '}
                <a href={whatsAppLink(bulkMessage)} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
                  Ask for a bulk rate on WhatsApp
                </a>
              </span>
            </li>
          </ul>

          <section className="mt-6">
            <h2 className="text-base font-bold text-slate-900">Highlights</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 marker:text-slate-400">
              {product.features.map((feature: string) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </section>
          <section className="mt-6">
            <h2 className="text-base font-bold text-slate-900">Description</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{product.description}</p>
          </section>
          <section className="mt-6">
            <h2 className="text-base font-bold text-slate-900">Product details</h2>
            <dl className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-4 text-sm">
            <div className="flex gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
              <p className="text-slate-600">
                Sold and shipped by <strong className="text-slate-900">YourEcom</strong>, medical disposable wholesaler
                <br />
                {ADDRESS[0]}, {ADDRESS[1]}
              </p>
            </div>
            <a href={PHONE_LINK} className="font-bold text-brand hover:underline">
              Call {PHONE}
            </a>
          </section>
        </div>
      </div>

      {!NO_API && (
        <div className={`${panel} mt-3 px-3 pb-6 sm:px-5 [&>section]:mt-0 [&>section]:pt-6`}>
          <ProductReviews product={product} user={user} onSaved={reloadProducts} />
        </div>
      )}

      {related.length > 0 && (
        <section className={`${panel} mt-3`}>
          <h2 className="border-b border-slate-100 px-4 py-3 text-lg font-bold text-slate-900">{sameCategory.length > 0 ? 'Similar products' : 'You may also need'}</h2>
          <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:gap-3 sm:p-3 lg:grid-cols-4 xl:grid-cols-5">
            {related.map((group: ProductGroup) => (
              <ProductCard key={group[0].id} group={group} {...shop} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
