import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Banknote, ChevronRight, MapPin, PackageCheck, ShoppingCart, TriangleAlert, Truck, Zap } from 'lucide-react';
import { ProductReviews } from '@/components/ProductReviews';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Price, ProductCard, RatingSummary, SaveButton, StockNote, WhatsAppIcon, panel, type ShopActions } from '@/components/StoreShared';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStoreInfo, whatsAppLink } from '@/hooks/useStoreInfo';
import { categoryPath, discountOf, groupByFamily, groupName, variantLabel, type ProductGroup } from '@/lib/catalogue';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, formatPrice, lineTotal, perItemPrice, priceLine } from '@/lib/pricing';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { CartItem, Product, User } from '@/types/store';

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

// A bulk order line as it adds up: the packs at the bulk price, the GST on them, and the two together.
function BulkSum({ line }: { line: CartItem }) {
  const rows: [string, number][] = [
    [`${line.quantity} × ${formatPrice(line.price)}`, line.price * line.quantity],
    [`GST ${line.product.bulk?.gstRate ?? 0}%`, line.gst],
  ];
  return (
    <dl className="space-y-1 text-sm text-slate-600">
      {rows.map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-3">
          <dt>{label}</dt>
          <dd>{formatPrice(amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-slate-200 pt-1 font-bold text-slate-900">
        <dt>Total</dt>
        <dd>{formatPrice(lineTotal(line))}</dd>
      </div>
    </dl>
  );
}

export function ProductPage({ products, openCart, user, reloadProducts, ...shop }: ProductPageProps) {
  const { lineOf, addToCart, setQuantity, isSaved, toggleSaved } = shop;
  const navigate = useNavigate();
  const { id } = useParams();
  const product = products.find((item: Product) => item.id === Number(id));
  // Retail, unless the shopper switches to a bulk order (or already has one in the cart). The choice stays while
  // they look at the product's other sizes.
  const [wantsBulk, setWantsBulk] = useState(() => Boolean(product && lineOf(product.id)?.bulk));
  // How many packs of a bulk order are being chosen, before it goes in the cart; for one product only.
  const [bulkDraft, setBulkDraft] = useState<{ id: number; quantity: number } | null>(null);
  const store = useStoreInfo();
  usePageTitle(product?.name ?? 'Page not found');

  if (!product) return <NotFoundPage />;
  const terms = product.bulk;
  const bulk = wantsBulk && terms !== null;
  const line = lineOf(product.id);
  // How many are in the cart the way the shopper is buying now. A line bought the other way is switched over when
  // they add this way.
  const quantity = line && Boolean(line.bulk) === bulk ? line.quantity : 0;
  const otherWay = line && quantity === 0 ? line : undefined;
  const soldOut = product.stock === 0;
  const bulkTooBig = terms !== null && product.stock < terms.minQuantity;
  const cantAdd = quantity === 0 && (bulk ? bulkTooBig : soldOut);
  const bulkQuantity = bulkDraft?.id === product.id ? bulkDraft.quantity : (terms?.minQuantity ?? 1);
  const sizes = product.family ? groupByFamily(products.filter((item: Product) => item.family === product.family))[0] : [product];
  const perItem = perItemPrice(product);
  // The rest of the category first, otherwise anything else; never this product's own sizes.
  const others = products.filter((item: Product) => groupName(item) !== groupName(product));
  const sameCategory = others.filter((item: Product) => item.category === product.category);
  const related = groupByFamily(sameCategory.length > 0 ? sameCategory : others).slice(0, 5);
  const bulkMessage = `Hello YourEcom, please share your bulk rate for ${product.name} (${product.unit}). Quantity I need: `;

  const add = (): void => addToCart(product, bulk ? { quantity: bulkQuantity, bulk: true } : {});

  const buyNow = (): void => {
    if (quantity === 0) add();
    navigate('/checkout');
  };

  // Add to cart and Buy now: under the photos on wide screens, under the price and sizes on phones. A bulk order
  // first picks its number of packs and shows what they come to with GST.
  const buyButtons = (className: string) => (
    <div className={className}>
      {bulk && terms && quantity === 0 && !bulkTooBig && (
        <div className="mb-3 space-y-3 rounded-md border border-brand/20 bg-brand-soft/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">Packs ({product.unit})</span>
            <QuantityStepper
              quantity={bulkQuantity}
              onChange={(next: number) => setBulkDraft({ id: product.id, quantity: Math.min(next, product.stock) })}
              label={product.name}
              max={product.stock}
              min={terms.minQuantity}
              removable={false}
              tone="light"
            />
          </div>
          <BulkSum line={priceLine(product, bulkQuantity, true)} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={quantity === 0 ? add : openCart}
          disabled={cantAdd}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-cart font-bold text-slate-900 shadow-sm transition hover:bg-cart-dark disabled:bg-slate-200 disabled:text-slate-500"
        >
          <ShoppingCart size={18} /> {quantity > 0 ? 'Go to cart' : bulk ? 'Add bulk order' : 'Add to cart'}
        </button>
        <button
          onClick={buyNow}
          disabled={cantAdd}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-buy font-bold text-slate-900 shadow-sm transition hover:bg-buy-dark disabled:bg-slate-200 disabled:text-slate-500"
        >
          <Zap size={18} /> Buy now
        </button>
      </div>
      {quantity > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
          <QuantityStepper quantity={quantity} onChange={(next: number) => setQuantity(product.id, next)} label={product.name} max={product.stock} min={bulk ? terms?.minQuantity : 1} />
          <p className="text-right text-sm text-slate-600">
            {bulk ? 'Bulk order in cart' : 'In your cart'}:{' '}
            <strong className="text-slate-900">{formatPrice(lineTotal(priceLine(product, quantity, bulk)))}</strong>
            {bulk && <span className="block text-xs">GST included</span>}
          </p>
        </div>
      )}
      {otherWay && (
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Your cart has {otherWay.quantity} {otherWay.bulk ? 'as a bulk order' : 'at the retail price'}. Adding {bulk ? 'a bulk order' : 'retail packs'} replaces{' '}
          {otherWay.quantity === 1 ? 'it' : 'them'}.
        </p>
      )}
    </div>
  );

  const details: [string, string][] = [
    ['Category', product.category],
    ...(product.variant ? [[variantLabel(sizes), product.variant] as [string, string]] : []),
    ['Pack', product.unit],
    ...product.specs,
    ['Sold by', 'YourEcom, New Delhi'],
  ];

  const ways: [boolean, string, string][] = terms
    ? [
        [false, 'Retail', 'Any number of packs, GST included'],
        [true, 'Bulk order', `From ${terms.minQuantity} packs, plus ${terms.gstRate}% GST`],
      ]
    : [];

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

          {/* Retail is the default; a product with bulk terms can be switched to a bulk order. */}
          {ways.length > 0 && (
            <div role="group" aria-label="Buy retail or in bulk" className="mt-4 grid max-w-md grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              {ways.map(([way, title, note]) => (
                <button
                  key={title}
                  type="button"
                  aria-pressed={bulk === way}
                  onClick={() => setWantsBulk(way)}
                  className={`rounded-md px-3 py-2 text-left transition ${bulk === way ? 'bg-white shadow-sm ring-1 ring-brand/30' : 'hover:bg-white/60'}`}
                >
                  <span className={`flex items-center gap-1.5 text-sm font-bold ${bulk === way ? 'text-brand' : 'text-slate-700'}`}>
                    {way && <PackageCheck size={15} />} {title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{note}</span>
                </button>
              ))}
            </div>
          )}

          {bulk && terms ? (
            <div className="mt-4">
              <p className="text-sm font-bold text-brand">Bulk price</p>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-3xl font-bold text-slate-900">{formatPrice(terms.price)}</span>
                <span className="text-base font-medium text-slate-600">+ {terms.gstRate}% GST</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {product.unit}
                {perItemPrice({ price: terms.price, unit: product.unit }) && ` (${perItemPrice({ price: terms.price, unit: product.unit })} before GST)`}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Smallest bulk order: <strong className="text-slate-900">{terms.minQuantity} packs</strong>
              </p>
              {bulkTooBig ? (
                <p className="mt-2 text-sm font-bold text-amber-700">
                  {soldOut ? 'Out of stock' : `Only ${product.stock} in stock`}, fewer than a bulk order. Call us on {store.phone} for a bulk supply.
                </p>
              ) : (
                <StockNote stock={product.stock} className="mt-2 text-sm" />
              )}
            </div>
          ) : (
            <div className="mt-4">
              {discountOf(product) > 0 && <p className="text-sm font-bold text-deal">Special price</p>}
              <Price product={product} large />
              <p className="mt-1 text-sm text-slate-500">
                {product.unit}
                {perItem && ` (${perItem})`} · Inclusive of all taxes
              </p>
              <StockNote stock={product.stock} className="mt-2 text-sm" />
            </div>
          )}

          {product.category === store.nonMedicalCategory && (
            <p className="mt-4 flex gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <span>
                <strong>Not for medical use.</strong> Everything in this section is a toy or a party item. For injections, see our{' '}
                <Link to={categoryPath('Syringes')} className="font-bold underline">
                  sterile medical syringes
                </Link>
                .
              </span>
            </p>
          )}

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
            {terms ? (
              <li className="flex gap-3">
                <PackageCheck size={18} className="shrink-0 text-brand" />
                <span>
                  <strong className="text-slate-900">Bulk rate</strong> {formatPrice(terms.price)} + {terms.gstRate}% GST a pack, from {terms.minQuantity} packs.{' '}
                  {!bulk && (
                    <button type="button" onClick={() => setWantsBulk(true)} className="font-medium text-brand hover:underline">
                      Order in bulk
                    </button>
                  )}
                </span>
              </li>
            ) : (
              <li className="flex gap-3">
                <WhatsAppIcon size={18} className="text-whatsapp" />
                <span>
                  <strong className="text-slate-900">Buying in bulk?</strong>{' '}
                  <a href={whatsAppLink(store, bulkMessage)} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
                    Ask for a bulk rate on WhatsApp
                  </a>
                </span>
              </li>
            )}
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
                {store.address.join(', ')}
              </p>
            </div>
            <a href={store.phoneLink} className="font-bold text-brand hover:underline">
              Call {store.phone}
            </a>
          </section>
        </div>
      </div>

      <div className={`${panel} mt-3 px-3 pb-6 sm:px-5 [&>section]:mt-0 [&>section]:pt-6`}>
        <ProductReviews product={product} user={user} onSaved={reloadProducts} />
      </div>

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
