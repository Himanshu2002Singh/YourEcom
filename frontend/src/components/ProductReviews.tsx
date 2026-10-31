import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { Star } from 'lucide-react';
import { LoadError, Loading, Stars } from '@/components/StoreShared';
import { ApiError, api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Product, Review, User } from '@/types/store';

type ReviewsAnswer = { reviews: Review[]; canReview: boolean };
type ProductReviewsProps = { product: Product; user: User | null | undefined; onSaved: () => void };

// Picks 1–5 stars for a review, then submits or updates it.
function ReviewForm({ productId, mine, saved }: { productId: number; mine?: Review; saved: (answer: ReviewsAnswer) => void }) {
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [comment, setComment] = useState(mine?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (rating === 0) return setMessage({ text: 'Choose a star rating', error: true });
    setSaving(true);
    try {
      saved(await api<ReviewsAnswer>(`/products/${productId}/reviews`, { method: 'PUT', body: { rating, comment } }));
      setMessage({ text: mine ? 'Your review is updated' : 'Thanks for your review' });
    } catch (error) {
      setMessage({ text: (error as ApiError).message, error: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3 className="font-bold text-navy">{mine ? 'Edit your review' : 'Write a review'}</h3>
      <div className="mt-3 flex gap-1" role="group" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((star: number) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              setRating(star);
              setMessage(null);
            }}
            aria-pressed={rating === star}
            aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
            className="rounded-lg p-1 transition hover:scale-110"
          >
            <Star size={26} className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
          </button>
        ))}
      </div>
      <label htmlFor="review-comment" className="mb-2 mt-4 block text-sm font-semibold text-navy">
        Your review <span className="font-semibold text-slate-400">(optional)</span>
      </label>
      <textarea
        id="review-comment"
        value={comment}
        maxLength={1000}
        rows={4}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          setComment(event.target.value);
          setMessage(null);
        }}
        placeholder="How did it work for you?"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : mine ? 'Update review' : 'Post review'}
        </button>
        {message && (
          <p role={message.error ? 'alert' : 'status'} className={`text-sm font-semibold ${message.error ? 'text-rose-500' : 'text-leaf'}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}

// Reviews from customers who ordered the product, and the form for writing (or editing) yours.
export function ProductReviews({ product, user, onSaved }: ProductReviewsProps) {
  const { pathname } = useLocation();
  const [answer, setAnswer] = useState<ReviewsAnswer | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0); // "Try again" bumps it
  const signedInEmail = user?.email; // whether you can review depends on who is signed in

  useEffect(() => {
    let current = true;
    setAnswer(null);
    setLoadError('');
    api<ReviewsAnswer>(`/products/${product.id}/reviews`)
      .then((data: ReviewsAnswer) => {
        if (current) setAnswer(data);
      })
      .catch((error: ApiError) => {
        if (current) setLoadError(error.message);
      });
    return () => {
      current = false;
    };
  }, [product.id, signedInEmail, attempt]);

  const reviews = answer?.reviews ?? [];
  const average = reviews.length ? reviews.reduce((total: number, review: Review) => total + review.rating, 0) / reviews.length : 0;
  const mine = reviews.find((review: Review) => review.mine);

  const saved = (next: ReviewsAnswer): void => {
    setAnswer(next);
    onSaved(); // the catalogue's ratings change too
  };

  return (
    <section id="reviews" className="mt-16 scroll-mt-24">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <h2 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Customer reviews</h2>
        {reviews.length > 0 && (
          <p className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span role="img" aria-label={`${average.toFixed(1)} out of 5 stars`}>
              <Stars rating={average} size={18} />
            </span>
            {average.toFixed(1)} out of 5 · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        )}
      </div>
      {!answer ? (
        <div className="mt-6">{loadError ? <LoadError message={loadError} retry={() => setAttempt(attempt + 1)} /> : <Loading label="Loading reviews…" />}</div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {reviews.length === 0 ? (
            <p className="h-fit rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No reviews yet.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review: Review) => (
                <li key={`${review.name}-${review.createdAt}`} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-navy">
                      {review.name}
                      {review.mine && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">You</span>}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</p>
                  </div>
                  <span role="img" aria-label={`${review.rating} out of 5 stars`} className="mt-2 inline-block">
                    <Stars rating={review.rating} />
                  </span>
                  {review.comment && <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{review.comment}</p>}
                  <p className="mt-3 text-xs font-bold text-leaf">Verified buyer</p>
                </li>
              ))}
            </ul>
          )}
          <aside className="h-fit rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            {user && answer.canReview ? (
              <ReviewForm key={product.id} productId={product.id} mine={mine} saved={saved} />
            ) : user ? (
              <p className="text-sm leading-6 text-slate-500">Only customers who have ordered this product can review it.</p>
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Bought this?{' '}
                <Link to="/login" state={{ from: pathname }} className="font-semibold text-brand hover:underline">
                  Sign in
                </Link>{' '}
                to write a review.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
