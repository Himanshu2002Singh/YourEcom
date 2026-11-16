import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Package, ReceiptText, ShieldAlert, Store, type LucideIcon } from 'lucide-react';
import type { User } from '@/types/store';

// Shared by the admin pages (pages/admin).
export const adminMain = 'mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 print:max-w-none print:p-0';
export const adminCard = 'rounded-xl border border-slate-200/80 bg-white shadow-sm print:border-0 print:shadow-none';
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50';
export const LOW_STOCK = 10; // a product with this many or fewer left shows as running low

const sections: [string, string, LucideIcon][] = [
  ['Dashboard', '/admin', LayoutDashboard],
  ['Orders', '/admin/orders', ReceiptText],
  ['Products', '/admin/products', Package],
];

// The admin pages' frame, in place of the store's header and footer: the sections, the way back to the store
// and signing out. On phones the sections get a row of their own under the bar.
export function AdminLayout({ user, signOut }: { user: User; signOut: () => Promise<void> }) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-navy text-white shadow-md print:hidden [@media(max-height:500px)]:static">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 px-4 lg:px-8">
          <Link to="/admin" className="flex items-center gap-2 py-3">
            <span className="font-logo text-xl font-semibold">YourEcom</span>
            <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">Admin</span>
          </Link>
          <nav aria-label="Admin sections" className="order-last -mx-2 flex w-[calc(100%+1rem)] gap-1 overflow-x-auto pb-2 sm:order-none sm:mx-0 sm:w-auto sm:pb-0">
            {sections.map(([label, to, Icon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10'}`
                }
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-blue-100">
            <Link to="/" aria-label="View store" className="flex items-center gap-1.5 rounded-lg px-2 py-2 transition hover:bg-white/10">
              <Store size={16} /> <span className="hidden sm:inline">View store</span>
            </Link>
            <span className="hidden max-w-40 truncate px-2 font-normal text-blue-200 md:inline">{user.name}</span>
            <button onClick={() => void signOut()} aria-label="Sign out" className="flex items-center gap-1.5 rounded-lg px-2 py-2 transition hover:bg-white/10">
              <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}

// A page's title, a line under it, and its main buttons on the right (under it on phones).
export function PageHeader({ title, description, back, actions }: { title: ReactNode; description?: ReactNode; back?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      {back}
      <div className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-end ${back ? 'mt-3' : ''}`}>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2 print:hidden">{actions}</div>}
      </div>
    </div>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand print:hidden">
      <ChevronLeft size={16} /> {children}
    </Link>
  );
}

// Which pages to offer as numbers: the first, the last, and the ones either side of this one, with gaps (null).
function pageNumbers(page: number, pages: number): (number | null)[] {
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((number) => number >= 1 && number <= pages).sort((a, b) => a - b);
  // A gap of one page shows that page; only longer gaps become "…".
  return shown.flatMap((number, index) => {
    const gap = index > 0 ? number - shown[index - 1] : 1;
    return gap === 1 ? [number] : gap === 2 ? [number - 1, number] : [null, number];
  });
}

// "21–40 of 71", with Previous, page numbers and Next. Nothing when everything fits on one page.
export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const step = 'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition disabled:opacity-40';
  return (
    <nav aria-label="Pages" className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
      <span>
        {((page - 1) * pageSize + 1).toLocaleString('en-IN')}–{Math.min(page * pageSize, total).toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}
      </span>
      <span className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={`${step} bg-white text-navy shadow-sm hover:text-brand`}>
          <ChevronLeft size={16} />
        </button>
        {pageNumbers(page, pages).map((number, index) =>
          number === null ? (
            <span key={`gap-${index}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={number}
              onClick={() => onPage(number)}
              aria-current={number === page ? 'page' : undefined}
              className={`${step} ${number === page ? 'bg-navy text-white' : 'bg-white text-navy shadow-sm hover:text-brand'}`}
            >
              {number}
            </button>
          ),
        )}
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page" className={`${step} bg-white text-navy shadow-sm hover:text-brand`}>
          <ChevronRight size={16} />
        </button>
      </span>
    </nav>
  );
}

function AdminMessage({ title, text, to, label }: { title: string; text: string; to: string; label: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <ShieldAlert size={36} className="text-brand" />
      <h1 className="mt-4 text-2xl font-semibold text-navy">{title}</h1>
      <p className="mt-2 text-slate-500">{text}</p>
      <Link to={to} className={`mt-6 ${primaryButton}`}>
        {label}
      </Link>
    </main>
  );
}

// For a signed-in customer who opens /admin. The API turns them away too.
export function AdminStaffOnly() {
  return <AdminMessage title="This area is for YourEcom staff" text="Your account doesn’t have access to the store’s admin pages." to="/" label="Back to store" />;
}

export function AdminNotFound() {
  return <AdminMessage title="Page not found" text="There’s no admin page at this address." to="/admin" label="Go to the dashboard" />;
}
