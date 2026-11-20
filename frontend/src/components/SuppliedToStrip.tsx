import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { panel } from '@/components/StoreShared';
import { governmentBuyers, type Logo } from '@/data/company';

// A government buyer's logo, fitted into a box of the given size. One with no logo shows its icon in a round seal
// as tall as the box instead, left out for screen readers since the name is always written beside it.
export function BuyerLogo({ logo, alt, className }: { logo: Logo; alt: string; className: string }) {
  if (typeof logo === 'string') return <img src={logo} alt={alt} className={`${className} object-contain`} />;
  const Icon = logo;
  return (
    <span aria-hidden="true" className={`${className} flex items-center justify-center`}>
      <span className="flex aspect-square h-full items-center justify-center rounded-full border-2 border-navy/70 bg-white text-navy">
        <Icon strokeWidth={1.75} className="h-1/2 w-1/2" />
      </span>
    </span>
  );
}

// The government buyers the client has supplied, as a strip of logos that scrolls by on its own and stops while
// the pointer is on it. Every name gets the same width and every logo the same box, so a wide wordmark sits as
// evenly as a crest. The list is drawn twice so the loop never shows a gap; screen readers get it once. With
// reduced motion it stays still and scrolls by hand.
export function SuppliedToStrip() {
  const list = (copy: boolean) => (
    <ul aria-hidden={copy || undefined} className={`flex shrink-0 items-start ${copy ? 'motion-reduce:hidden' : ''}`}>
      {governmentBuyers.map(([short, full, logo]) => (
        <li key={short} title={full} className="flex w-36 shrink-0 flex-col items-center gap-2 px-2 text-center sm:w-40">
          <BuyerLogo logo={logo} alt={copy ? '' : `${full} logo`} className="h-14 w-28" />
          <span className="text-xs font-semibold leading-tight text-slate-700">{short}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-labelledby="supplied-to-title" className={`${panel} py-4`}>
      <div className="flex items-center justify-between gap-4 px-4">
        <div>
          <h2 id="supplied-to-title" className="text-lg font-bold text-slate-900">
            Supplied to
          </h2>
          <p className="text-sm text-slate-500">Government hospitals, forces and institutions we have supplied</p>
        </div>
        <Link to="/about#supplied-to" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline sm:flex">
          About us <ChevronRight size={16} />
        </Link>
      </div>
      <div className="group mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:overflow-x-auto">
        <div className="flex w-max motion-safe:animate-marquee group-hover:[animation-play-state:paused]">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}
