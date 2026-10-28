import type { ChangeEvent } from 'react';
import { Link } from 'react-router';
import { ArrowRight, MapPin, PackageOpen } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import type { CartItem, Order, User } from '@/types/store';

type ProfilePageProps = { user: User; orders: Order[]; signOut: () => void; updatePreferences: (preferences: User['preferences']) => void };

const preferenceOptions: [keyof User['preferences'], string][] = [
  ['smsUpdates', 'Order updates by SMS'],
  ['offers', 'Care tips & offers'],
];

export function ProfilePage({ user, orders, signOut, updatePreferences }: ProfilePageProps) {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const itemsOrdered = orders.reduce((total: number, order: Order) => total + order.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0), 0);
  const totalSpent = orders.reduce((total: number, order: Order) => total + order.total, 0);
  const savedAddress = orders[0]?.delivery;
  const stats = [
    [String(orders.length), orders.length === 1 ? 'Order placed' : 'Orders placed'],
    [String(itemsOrdered), itemsOrdered === 1 ? 'Item ordered' : 'Items ordered'],
    [formatPrice(totalSpent), 'Total spent'],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#159a7a]">Your account</p>
          <h1 className="mt-2 text-4xl font-black text-[#082b62]">Hello, {user.name.split(' ')[0]}.</h1>
          <p className="mt-2 text-slate-500">Manage your details and keep your care essentials close.</p>
        </div>
        <button
          onClick={signOut}
          className="self-start rounded-full border border-slate-200 px-5 py-2.5 text-sm font-extrabold text-slate-500 transition hover:border-[#0b6fce] hover:text-[#0b6fce]"
        >
          Sign out
        </button>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl bg-[#082b62] p-6 text-white md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c9f23b] text-2xl font-black text-[#082b62]">{initials}</div>
              <h2 className="mt-5 text-2xl font-black">{user.name}</h2>
              <p className="mt-1 truncate text-blue-200">{user.email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#c9f23b]">Member since {user.memberSince}</span>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs text-blue-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <Link to="/orders" className="group rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#0b6fce]">
            <PackageOpen />
          </div>
          <h3 className="mt-5 text-xl font-black text-[#082b62]">My orders</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Track deliveries and view your purchase history.</p>
          <span className="mt-5 flex items-center gap-2 text-sm font-extrabold text-[#0b6fce]">
            View orders <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#082b62]">Saved address</h2>
          {savedAddress ? (
            <div className="mt-6 flex gap-3">
              <div className="h-fit rounded-xl bg-emerald-50 p-3 text-[#159a7a]">
                <MapPin size={19} />
              </div>
              <div>
                <p className="font-extrabold text-[#082b62]">{savedAddress.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {savedAddress.address},
                  <br />
                  {savedAddress.city} – {savedAddress.pincode}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-600">{savedAddress.phone}</p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm leading-6 text-slate-500">Your delivery address is saved here after your first order.</p>
          )}
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#082b62]">Account preferences</h2>
          <div className="mt-6 space-y-4">
            {preferenceOptions.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between text-sm font-bold text-slate-600">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={user.preferences[key]}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updatePreferences({ ...user.preferences, [key]: event.target.checked })}
                  className="h-5 w-5 accent-[#0b6fce]"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
