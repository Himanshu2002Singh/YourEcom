import { Link } from 'react-router';
import { BadgeCheck, ChevronRight, Headset, Mail, MapPin, Phone, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import { LoadError, Loading, ProductCard, WhatsAppIcon, panel, type ShopActions } from '@/components/StoreShared';
import { categories, categoryImages } from '@/data/categories';
import { ADDRESS, EMAIL, MAP_LINK, PHONE, PHONE_LINK, whatsAppLink } from '@/data/contact';
import { usePageTitle } from '@/hooks/usePageTitle';
import { byCategory, categoryPath, discountOf, groupByFamily, groupName, variantSummary, type ProductGroup } from '@/lib/catalogue';
import { formatPrice } from '@/lib/pricing';
import type { Category, Product } from '@/types/store';

const BULK_MESSAGE = 'Hello YourEcom, please share your bulk rate for syringes. Sizes and quantities I need: ';
const QUOTE_MESSAGE = 'Hello YourEcom, please send a quotation for our hospital / clinic. Products and quantities: ';

// After the syringes, every other category gets a panel, four to a row as on a marketplace home page.
const PANEL_ROWS: Category[][] = [
  ['IV Cannula', 'IV Sets', 'Gloves', 'Face Masks'],
  ['Caps & Shoe Covers', 'Bandages & Gauze', 'Lab Disposables'],
];

// What the client promises, from their posters.
const promises: [LucideIcon, string, string][] = [
  [BadgeCheck, 'High quality products', 'Sterile, sealed and single-use, as medical disposables should be.'],
  [ShieldCheck, 'Hygienic and safe', 'Stored and packed with care, so every box reaches you clean.'],
  [Truck, 'Timely delivery', 'Orders go out on time, from a single box to a full consignment.'],
  [Headset, 'Customer support', 'Call or WhatsApp us about sizes, stock and bulk rates.'],
];

const viewAllClass = 'inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark';

const lowestPrice = (group: ProductGroup): number => Math.min(...group.map((product: Product) => product.price));
const bestDiscount = (group: ProductGroup): number => Math.max(...group.map(discountOf));

type HomePageProps = ShopActions & {
  products: Product[] | null; // null while the catalogue loads from the API
  catalogueError: string;
  reloadProducts: () => void;
};

// A category's best on one panel: up to three products as tiles (or one large tile), then "See all".
function CategoryPanel({ category, groups }: { category: Category; groups: ProductGroup[] }) {
  const tile = (group: ProductGroup, large: boolean) => {
    const first = group[0];
    const off = bestDiscount(group);
    return (
      <Link to={`/product/${first.id}`} className="group block">
        <img src={first.image} alt="" loading="lazy" className={`w-full rounded object-cover ${large ? 'aspect-[4/3]' : 'aspect-square'}`} />
        <p className={`mt-1.5 line-clamp-2 text-slate-700 group-hover:text-brand ${large ? 'text-sm' : 'text-xs'}`}>{group.length > 1 ? groupName(first) : first.name}</p>
        <p className={large ? 'text-sm' : 'text-xs'}>
          <span className="font-bold text-slate-900">
            {group.length > 1 ? 'From ' : ''}
            {formatPrice(lowestPrice(group))}
          </span>
          {off > 0 && <span className="ml-1.5 font-bold text-deal">{group.length > 1 ? `Up to ${off}% off` : `${off}% off`}</span>}
        </p>
        {large && group.length > 1 && <p className="text-xs text-slate-500">{variantSummary(group)}</p>}
      </Link>
    );
  };
  return (
    <section className={`${panel} flex flex-col p-4`}>
      <h2 className="text-lg font-bold text-slate-900">{category}</h2>
      {groups.length === 1 ? (
        <div className="mt-3 flex-1">{tile(groups[0], true)}</div>
      ) : (
        <ul className="mt-3 grid flex-1 grid-cols-2 content-start gap-3">
          {groups.slice(0, 3).map((group: ProductGroup) => (
            <li key={group[0].id}>{tile(group, false)}</li>
          ))}
          <li>
            <Link to={categoryPath(category)} className="flex aspect-square flex-col items-center justify-center gap-1 rounded bg-brand-soft text-center text-xs font-bold text-brand transition hover:bg-brand hover:text-white">
              <ChevronRight size={22} /> See all
            </Link>
          </li>
        </ul>
      )}
      <Link to={categoryPath(category)} className="mt-4 text-sm font-medium text-brand hover:underline">
        See more
      </Link>
    </section>
  );
}

export function HomePage({ products, catalogueError, reloadProducts, ...shop }: HomePageProps) {
  usePageTitle();
  const groups = groupByFamily([...(products ?? [])].sort(byCategory));
  const groupsIn = (category: Category): ProductGroup[] => groups.filter((group: ProductGroup) => group[0].category === category);

  return (
    <main className="mx-auto max-w-[1400px] space-y-3 px-2 py-3 sm:px-4">
      <section aria-label="Shop by category" className={`${panel} px-1 py-3 sm:px-3`}>
        <ul className="flex gap-1 overflow-x-auto scrollbar-none lg:justify-between">
          {categories.map((category) => (
            <li key={category} className="shrink-0">
              <Link to={categoryPath(category)} className="group flex w-[5.25rem] flex-col items-center gap-2 rounded-md p-1 text-center sm:w-28">
                <img src={categoryImages[category]} alt="" className="h-16 w-16 rounded-full border border-slate-200 object-cover transition group-hover:scale-105 sm:h-20 sm:w-20" />
                <span className="text-xs font-medium leading-tight text-slate-800 group-hover:text-brand sm:text-sm">{category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {!products ? (
        <div className={panel}>{catalogueError ? <LoadError message={catalogueError} retry={reloadProducts} /> : <Loading label="Loading products…" />}</div>
      ) : (
        <>
          <section className={panel}>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Disposable syringes</h2>
                <p className="text-sm text-slate-500">Our main line. Sterile and single-use, without needle or with needle fitted.</p>
              </div>
              <Link to={categoryPath('Syringes')} className={viewAllClass}>
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
              <div className="flex gap-3 overflow-x-auto scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible lg:order-last">
                {groupsIn('Syringes').map((group: ProductGroup) => (
                  <div key={group[0].id} className="w-[46%] shrink-0 sm:w-auto">
                    <ProductCard group={group} {...shop} />
                  </div>
                ))}
              </div>
              <aside className="relative flex min-h-56 flex-col justify-end overflow-hidden rounded-md bg-navy p-5 text-white">
                <img src="/photos/coloured-syringes.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-transparent" />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-widest text-cart">Bulk rates</p>
                  <p className="mt-1 text-xl font-bold leading-snug">Syringes for hospitals and clinics, by the carton</p>
                  <p className="mt-2 text-sm text-blue-100">Tell us the sizes and quantities and we will send a quotation.</p>
                  <a
                    href={whatsAppLink(BULK_MESSAGE)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy transition hover:bg-brand-soft"
                  >
                    <WhatsAppIcon size={17} className="text-whatsapp" /> Get a bulk rate
                  </a>
                </div>
              </aside>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PANEL_ROWS[0].map((category: Category) => (
              <CategoryPanel key={category} category={category} groups={groupsIn(category)} />
            ))}
          </div>

          <section className="relative overflow-hidden rounded-md bg-navy text-white">
            <img src="/photos/warehouse-stock.jpg" alt="" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover sm:block [mask-image:linear-gradient(to_right,transparent,black_45%)]" />
            <div className="relative max-w-xl px-5 py-7 sm:px-8 sm:py-9">
              <p className="text-xs font-bold uppercase tracking-widest text-cart">Wholesale · Retail · Government supply · Local supply</p>
              <h2 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">Supplies for government hospitals, clinics and institutions</h2>
              <p className="mt-2 text-blue-100">Send us your list for a quotation, or call us. Local supply to hospitals, clinics and health centres too.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={whatsAppLink(QUOTE_MESSAGE)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-cart px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-cart-dark"
                >
                  <WhatsAppIcon size={17} /> WhatsApp for a quote
                </a>
                <a href={PHONE_LINK} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-bold transition hover:bg-white/10">
                  <Phone size={16} /> {PHONE}
                </a>
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PANEL_ROWS[1].map((category: Category) => (
              <CategoryPanel key={category} category={category} groups={groupsIn(category)} />
            ))}
            <section className={`${panel} flex flex-col p-4`}>
              <h2 className="text-lg font-bold text-slate-900">Hospital PPE in one order</h2>
              <img src="/photos/ppe-kit.jpg" alt="Shoe covers, bouffant caps, surgeon caps and 3-ply masks" loading="lazy" className="mt-3 aspect-[4/3] w-full rounded object-cover" />
              <p className="mt-2 text-sm text-slate-600">Masks, caps and shoe covers for wards and theatres, packed by the hundred.</p>
              <Link to={categoryPath('Caps & Shoe Covers')} className="mt-auto pt-3 text-sm font-medium text-brand hover:underline">
                Shop caps and shoe covers
              </Link>
            </section>
          </div>

          <section className={panel}>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">All products</h2>
              <Link to="/products" className={viewAllClass}>
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 sm:gap-3 sm:p-3 lg:grid-cols-4 xl:grid-cols-5">
              {groups.map((group: ProductGroup) => (
                <ProductCard key={group[0].id} group={group} {...shop} />
              ))}
            </div>
          </section>
        </>
      )}

      <section id="contact" className={`${panel} scroll-mt-32`}>
        <ul className="grid gap-6 border-b border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(([Icon, title, text]) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon size={21} />
              </span>
              <div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-0.5 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <address className="grid gap-2 text-sm not-italic text-slate-700 sm:grid-cols-3 sm:gap-5">
            <a href={MAP_LINK} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:text-brand">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong className="block text-slate-900">YourEcom, Medical Disposable Wholesaler</strong>
                {ADDRESS[0]}, {ADDRESS[1]}
              </span>
            </a>
            <a href={PHONE_LINK} className="flex gap-2.5 hover:text-brand">
              <Phone size={18} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong className="block text-slate-900">Call / WhatsApp</strong>
                {PHONE}
              </span>
            </a>
            <a href={`mailto:${EMAIL}`} className="flex gap-2.5 hover:text-brand">
              <Mail size={18} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong className="block text-slate-900">Email</strong>
                {EMAIL}
              </span>
            </a>
          </address>
          <a
            href={whatsAppLink(QUOTE_MESSAGE)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
          >
            <WhatsAppIcon size={18} /> Bulk order enquiry
          </a>
        </div>
      </section>
    </main>
  );
}
