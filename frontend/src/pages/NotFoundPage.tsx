import { Link } from 'react-router';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-leaf">Error 404</p>
      <h1 className="mt-3 text-4xl font-semibold text-navy">Page not found</h1>
      <p className="mt-3 text-slate-500">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="mt-7 rounded-lg bg-brand px-7 py-4 font-semibold text-white transition hover:bg-navy">
        Back to store
      </Link>
    </main>
  );
}
