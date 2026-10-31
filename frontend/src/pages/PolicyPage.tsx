import { Link, useParams } from 'react-router';
import { Phone } from 'lucide-react';
import { WhatsAppIcon } from '@/components/StoreShared';
import { PHONE, PHONE_LINK, whatsAppLink } from '@/data/contact';
import { POLICIES_UPDATED, policies, type Policy } from '@/data/policies';
import { usePageTitle } from '@/hooks/usePageTitle';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function PolicyPage() {
  const { slug } = useParams();
  const policy = policies.find((item: Policy) => item.slug === slug);
  usePageTitle(policy?.title ?? 'Page not found');

  if (!policy) return <NotFoundPage />;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-leaf">Policies</p>
      <h1 className="mt-2 text-4xl font-semibold text-navy">{policy.title}</h1>
      <p className="mt-3 text-lg leading-8 text-slate-500">{policy.summary}</p>
      <p className="mt-2 text-xs font-semibold text-slate-400">Last updated {POLICIES_UPDATED}</p>
      <nav aria-label="Other policies" className="mt-6 flex flex-wrap gap-2">
        {policies.map((item: Policy) => (
          <Link
            key={item.slug}
            to={`/policies/${item.slug}`}
            aria-current={item.slug === policy.slug ? 'page' : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${item.slug === policy.slug ? 'bg-navy text-white' : 'bg-white text-slate-500 hover:text-navy'}`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="mt-8 space-y-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        {policy.sections.map(({ heading, paragraphs }) => (
          <section key={heading}>
            <h2 className="text-xl font-semibold text-navy">{heading}</h2>
            {paragraphs.map((paragraph: string) => (
              <p key={paragraph} className="mt-3 leading-7 text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <div className="mt-6 rounded-xl bg-brand-soft p-6 text-sm text-slate-600">
        <p className="font-semibold text-navy">Questions about this policy?</p>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-bold">
          <a href={PHONE_LINK} className="inline-flex items-center gap-2 text-brand hover:underline">
            <Phone size={15} /> {PHONE}
          </a>
          <a href={whatsAppLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-brand hover:underline">
            <WhatsAppIcon size={15} /> Chat on WhatsApp
          </a>
        </p>
      </div>
    </main>
  );
}
