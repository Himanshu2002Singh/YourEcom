import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Error 404</p>
      <h1 className="mt-3 text-4xl font-black text-[#082b62]">Page not found</h1>
      <p className="mt-3 text-slate-500">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="mt-7 rounded-full bg-[#0b6fce] px-7 py-4 font-extrabold text-white transition hover:bg-[#082b62]">
        Back to store
      </Link>
    </main>
  );
}
