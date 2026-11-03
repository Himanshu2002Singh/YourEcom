import { Link } from 'react-router';
import { ChevronRight, ExternalLink, Landmark, Mail, MapPin, Phone, ReceiptText } from 'lucide-react';
import { WhatsAppIcon, panel } from '@/components/StoreShared';
import { categories, categoryImages } from '@/data/categories';
import { ABOUT_TEXT, SUPPLY_TYPES, governmentBuyers, stockPhotos } from '@/data/company';
import { ADDRESS, EMAIL, GSTIN, INDIAMART_LINK, MAP_LINK, PHONE, PHONE_LINK, whatsAppLink } from '@/data/contact';
import { usePageTitle } from '@/hooks/usePageTitle';
import { categoryPath } from '@/lib/catalogue';

const QUOTE_MESSAGE = 'Hello YourEcom, please send a quotation. Products and quantities: ';

const sectionTitle = 'text-lg font-bold text-slate-900 sm:text-xl';

// Who YourEcom is: the client's own words, the government buyers they have supplied, their stock, what they
// sell and their business details.
export function AboutPage() {
  usePageTitle('About us');
  return (
    <main className="mx-auto max-w-[1400px] space-y-3 px-2 py-3 sm:px-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-1 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand">
          Home
        </Link>
        <ChevronRight size={12} />
        <span className="text-slate-700">About us</span>
      </nav>

      <section className="grid overflow-hidden rounded-md bg-navy text-white lg:grid-cols-2">
        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-cart">Medical disposable wholesaler · New Delhi</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">About YourEcom</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-100">{ABOUT_TEXT}</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="How we supply">
            {SUPPLY_TYPES.map((type) => (
              <li key={type} className="rounded-full border border-white/30 px-3 py-1 text-xs font-bold">
                {type}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
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
        {/* The text sets the banner's height on wide screens; the photo fills whatever that is. */}
        <div className="relative h-64 sm:h-80 lg:h-auto">
          <img src="/photos/stock-cartons.jpg" alt="Cartons of Magnum face masks and J.K. Diagnostics blood collection tubes in our stock" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </section>

      <section id="supplied-to" className={`${panel} scroll-mt-32 p-5 sm:p-6`}>
        <h2 className={sectionTitle}>Supplied to government institutions</h2>
        <p className="mt-1 text-sm text-slate-500">Departments, forces, hospitals and research centres we have supplied.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {governmentBuyers.map(([short, full]) => (
            <li key={short} className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Landmark size={19} />
              </span>
              <span className="text-sm font-semibold leading-snug text-slate-800">{full}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${panel} p-5 sm:p-6`}>
        <h2 className={sectionTitle}>From our stock</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {stockPhotos.map(([src, alt]) => (
            <li key={src}>
              <img src={src} alt={alt} loading="lazy" className="aspect-[4/3] w-full rounded object-cover" />
              <p className="mt-1.5 text-xs leading-snug text-slate-500">{alt}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${panel} p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-4">
          <h2 className={sectionTitle}>What we supply</h2>
          <Link to="/products" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand hover:underline">
            All products <ChevronRight size={16} />
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((category) => (
            <li key={category}>
              <Link to={categoryPath(category)} className="group block text-center">
                <img src={categoryImages[category]} alt="" loading="lazy" className="aspect-square w-full rounded-md border border-slate-200 object-cover transition group-hover:border-brand" />
                <span className="mt-1.5 block text-xs font-medium leading-tight text-slate-800 group-hover:text-brand sm:text-sm">{category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={panel} aria-labelledby="business-details">
        <h2 id="business-details" className={`${sectionTitle} px-5 pt-5 sm:px-6 sm:pt-6`}>
          Business details
        </h2>
        <address className="grid gap-5 p-5 text-sm not-italic text-slate-700 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <a href={MAP_LINK} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:text-brand">
            <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
            <span>
              <strong className="block text-slate-900">Address</strong>
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
          <div className="flex gap-2.5">
            <ReceiptText size={18} className="mt-0.5 shrink-0 text-brand" />
            <span>
              <strong className="block text-slate-900">GSTIN</strong>
              {GSTIN}
              <a href={INDIAMART_LINK} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 font-medium text-brand hover:underline">
                Our IndiaMART profile <ExternalLink size={13} />
              </a>
            </span>
          </div>
        </address>
      </section>
    </main>
  );
}
