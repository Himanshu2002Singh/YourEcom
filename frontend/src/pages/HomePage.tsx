import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Bandage,
  Clock3,
  Droplets,
  Facebook,
  Hand,
  HeartHandshake,
  Instagram,
  Layers,
  Mail,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShieldPlus,
  Sparkles,
  Syringe,
  Truck,
  Users,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { ProductCard } from '@/components/StoreShared';
import { categories, products } from '@/data/products';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Category, Product } from '@/types/store';

const ALL_PRODUCTS = 'All products' as const;

const categoryStyles: Record<Category, { icon: LucideIcon; tone: string }> = {
  'Face Masks': { icon: ShieldPlus, tone: 'bg-sky-50 text-sky-700' },
  Gloves: { icon: Hand, tone: 'bg-emerald-50 text-emerald-700' },
  Syringes: { icon: Syringe, tone: 'bg-amber-50 text-amber-700' },
  'IV Sets': { icon: Droplets, tone: 'bg-blue-50 text-blue-700' },
  Bandages: { icon: Bandage, tone: 'bg-rose-50 text-rose-700' },
  'Gauze & Cotton': { icon: Layers, tone: 'bg-teal-50 text-teal-700' },
};

const reasons = [
  ['01', 'Quality checked', 'Every product is sourced from trusted manufacturers.'],
  ['02', 'Made for bulk', 'Flexible pricing for hospitals and growing practices.'],
  ['03', 'Human support', 'Real people ready to help with your requirements.'],
  ['04', 'Quick dispatch', 'Orders packed carefully and sent out on time.'],
];

type HomePageProps = {
  quantityOf: (id: number) => number;
  addToCart: (product: Product) => void;
  setQuantity: (id: number, quantity: number) => void;
  search: string;
  setSearch: (search: string) => void;
};

export function HomePage({ quantityOf, addToCart, setQuantity, search, setSearch }: HomePageProps) {
  const [activeCategory, setActiveCategory] = useState<Category | typeof ALL_PRODUCTS>(ALL_PRODUCTS);
  const query = search.trim().toLowerCase();
  const filtering = query !== '' || activeCategory !== ALL_PRODUCTS;
  usePageTitle();
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product: Product) =>
          (activeCategory === ALL_PRODUCTS || product.category === activeCategory) &&
          [product.name, product.category, product.description].some((text: string) => text.toLowerCase().includes(query)),
      ),
    [activeCategory, query],
  );

  const showCategory = (category: Category): void => {
    setActiveCategory(category);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const showAllProducts = (): void => {
    setActiveCategory(ALL_PRODUCTS);
    setSearch('');
  };

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-[#eaf7ff]">
        <div className="absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full bg-[#c9f23b]/50 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-20 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b7e7e0] bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#108b77]">
              <Sparkles size={15} /> Healthcare, delivered better
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.03] tracking-[-0.06em] text-[#082b62] sm:text-6xl lg:text-[5.2rem]">
              Everyday care.
              <br />
              <span className="text-[#0b86d8]">Made simple.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Reliable medical disposables for hospitals, clinics and homes. Quality you can count on, delivered right to your door.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/#products"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#0b6fce] px-7 py-4 font-extrabold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1 hover:bg-[#085daf]"
              >
                Explore products <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link to="/#bulk" className="inline-flex items-center justify-center rounded-full border-2 border-[#0b6fce] px-7 py-4 font-extrabold text-[#0b6fce] transition hover:bg-white">
                Request bulk quote
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#159a7a]" /> Certified quality
              </span>
              <span className="flex items-center gap-2">
                <Truck size={18} className="text-[#159a7a]" /> Pan-India delivery
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border-[14px] border-[#c9f23b] opacity-80" />
            <div className="relative overflow-hidden rounded-[2rem] rounded-bl-[6rem] border-8 border-white bg-white shadow-2xl shadow-blue-200/70">
              <img
                className="h-[430px] w-full object-cover lg:h-[510px]"
                src="https://images.pexels.com/photos/11069119/pexels-photo-11069119.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Face masks and disposable gloves"
              />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#159a7a]">Your trusted partner</p>
                    <p className="mt-1 font-extrabold text-[#082b62]">Safe. Hygienic. Reliable.</p>
                  </div>
                  <div className="flex -space-x-2">
                    <span className="h-9 w-9 rounded-full border-2 border-white bg-[#0b6fce]" />
                    <span className="h-9 w-9 rounded-full border-2 border-white bg-[#159a7a]" />
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#c9f23b] text-xs font-black text-[#082b62]">+5k</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-4 flex items-center gap-3 rounded-2xl bg-[#082b62] px-5 py-4 text-white shadow-xl">
              <div className="rounded-xl bg-[#c9f23b] p-2 text-[#082b62]">
                <PackageCheck size={22} />
              </div>
              <div>
                <p className="text-xl font-black">5,000+</p>
                <p className="text-xs text-blue-100">orders fulfilled</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 text-sm font-bold text-slate-500 lg:justify-between lg:px-8">
          <span className="flex items-center gap-3">
            <ShieldCheck className="text-[#159a7a]" /> ISO-certified products
          </span>
          <span className="flex items-center gap-3">
            <Truck className="text-[#0b6fce]" /> Fast &amp; safe delivery
          </span>
          <span className="flex items-center gap-3">
            <HeartHandshake className="text-[#e25d54]" /> Trusted support
          </span>
          <span className="flex items-center gap-3">
            <Users className="text-[#d09921]" /> 500+ happy partners
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Shop by category</p>
          <h2 className="text-3xl font-black tracking-tight text-[#082b62] sm:text-4xl">Care essentials for every need</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category: Category) => {
            const { icon: Icon, tone } = categoryStyles[category];
            const count = products.filter((product: Product) => product.category === category).length;
            return (
              <button
                key={category}
                onClick={() => showCategory(category)}
                className="group rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl"
              >
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon size={26} />
                </div>
                <p className="font-extrabold text-[#082b62]">{category}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {count} {count === 1 ? 'product' : 'products'}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section id="products" className="scroll-mt-20 bg-[#f1f7fb] py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Customer favourites</p>
          <h2 className="text-3xl font-black tracking-tight text-[#082b62] sm:text-4xl">Quality supplies, honest prices</h2>
          <div className="mb-8 mt-6 flex flex-wrap gap-2 text-sm font-bold">
            {[ALL_PRODUCTS, ...categories].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`whitespace-nowrap rounded-full px-4 py-2 transition ${activeCategory === category ? 'bg-[#082b62] text-white' : 'bg-white text-slate-500 hover:text-[#082b62]'}`}
              >
                {category}
              </button>
            ))}
          </div>
          {filtering && (
            <p className="-mt-3 mb-6 text-sm font-semibold text-slate-500">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              {activeCategory !== ALL_PRODUCTS && (
                <>
                  {' '}in <strong className="text-[#082b62]">{activeCategory}</strong>
                </>
              )}
              {query && (
                <>
                  {' '}for “<strong className="text-[#082b62]">{search.trim()}</strong>”
                </>
              )}
              <button onClick={showAllProducts} className="-my-1 ml-3 py-1 font-extrabold text-[#0b6fce] hover:underline">
                Clear filters
              </button>
            </p>
          )}
          {filteredProducts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} quantity={quantityOf(product.id)} addToCart={addToCart} setQuantity={setQuantity} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-500">
              <p>No supplies match your search. Try another term or category.</p>
              <button onClick={showAllProducts} className="mt-5 rounded-full bg-[#0b6fce] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#082b62]">
                Show all products
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="why-us" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative">
            <img
              className="h-72 w-full rounded-[2rem] object-cover shadow-xl sm:h-[420px]"
              src="https://images.pexels.com/photos/5729400/pexels-photo-5729400.jpeg?auto=compress&cs=tinysrgb&w=1000"
              alt="Syringe resting on a surgical mask"
              loading="lazy"
            />
            <div className="absolute -bottom-5 -right-2 rounded-2xl bg-white p-4 shadow-xl sm:right-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-[#159a7a]">
                  <Clock3 size={22} />
                </div>
                <div>
                  <p className="font-black text-[#082b62]">On-time delivery</p>
                  <p className="text-xs font-semibold text-slate-400">Always, every time</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Why YourEcom</p>
            <h2 className="max-w-lg text-4xl font-black leading-tight tracking-tight text-[#082b62]">The care behind every order.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              From first click to final delivery, we make sourcing everyday medical essentials feel simple, safe and dependable.
            </p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {reasons.map(([number, title, description]) => (
                <div key={number} className="flex gap-3">
                  <span className="text-sm font-black text-[#0b86d8]">{number}</span>
                  <div>
                    <h3 className="font-extrabold text-[#082b62]">{title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mb-16 max-w-7xl px-5 lg:px-8">
        <section id="bulk" className="scroll-mt-40 overflow-hidden rounded-[2rem] bg-[#082b62] md:scroll-mt-24">
          <div className="relative flex flex-col justify-between gap-8 px-6 py-10 sm:px-12 lg:flex-row lg:items-center lg:py-12">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,_rgba(11,134,216,.35),_transparent_65%)]" />
            <div className="relative">
              <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[#c9f23b]">Need more than a box?</p>
              <h2 className="max-w-xl text-3xl font-black text-white sm:text-4xl">Stock up smart with our bulk orders.</h2>
              <p className="mt-3 max-w-xl text-blue-100">Get custom pricing, dedicated support and reliable supply for your hospital, clinic or business.</p>
            </div>
            <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row">
              <a href="tel:+919643821551" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#c9f23b] px-5 py-4 text-sm font-black text-[#082b62] transition hover:bg-white sm:px-6 sm:text-base">
                <Phone size={18} /> Call +91 96438 21551
              </a>
              <a
                href="mailto:hello@yourecom.in?subject=Bulk%20order%20enquiry"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-white/30 px-5 py-4 text-sm font-black text-white transition hover:border-white hover:bg-white/10 sm:px-6 sm:text-base"
              >
                <Mail size={18} /> Email for a quote
              </a>
            </div>
          </div>
        </section>
      </div>

      <section id="contact" className="scroll-mt-20 border-t border-slate-100 bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <p className="text-lg font-extrabold text-[#082b62]">Need help choosing supplies?</p>
            <p className="mt-2 text-slate-500">
              Call us at{' '}
              <a href="tel:+919643821551" className="font-bold text-[#0b6fce] hover:underline">
                +91 96438 21551
              </a>{' '}
              or email{' '}
              <a href="mailto:hello@yourecom.in" className="font-bold text-[#0b6fce] hover:underline">
                hello@yourecom.in
              </a>
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-400" aria-hidden="true">
            <Instagram size={18} />
            <Facebook size={18} />
            <Youtube size={18} />
          </div>
        </div>
      </section>
    </main>
  );
}
