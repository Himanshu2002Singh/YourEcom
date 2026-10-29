import { Link, useParams } from 'react-router';
import { Mail, Phone } from 'lucide-react';
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
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Policies</p>
      <h1 className="mt-2 text-4xl font-black text-[#082b62]">{policy.title}</h1>
      <p className="mt-3 text-lg leading-8 text-slate-500">{policy.summary}</p>
      <p className="mt-2 text-xs font-semibold text-slate-400">Last updated {POLICIES_UPDATED}</p>
      <nav aria-label="Other policies" className="mt-6 flex flex-wrap gap-2">
        {policies.map((item: Policy) => (
          <Link
            key={item.slug}
            to={`/policies/${item.slug}`}
            aria-current={item.slug === policy.slug ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${item.slug === policy.slug ? 'bg-[#082b62] text-white' : 'bg-white text-slate-500 hover:text-[#082b62]'}`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="mt-8 space-y-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        {policy.sections.map(({ heading, paragraphs }) => (
          <section key={heading}>
            <h2 className="text-xl font-black text-[#082b62]">{heading}</h2>
            {paragraphs.map((paragraph: string) => (
              <p key={paragraph} className="mt-3 leading-7 text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-sky-50 p-6 text-sm text-slate-600">
        <p className="font-extrabold text-[#082b62]">Questions about this policy?</p>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-bold">
          <a href="tel:+919643821551" className="inline-flex items-center gap-2 text-[#0b6fce] hover:underline">
            <Phone size={15} /> +91 96438 21551
          </a>
          <a href="mailto:hello@yourecom.in" className="inline-flex items-center gap-2 text-[#0b6fce] hover:underline">
            <Mail size={15} /> hello@yourecom.in
          </a>
        </p>
      </div>
    </main>
  );
}
