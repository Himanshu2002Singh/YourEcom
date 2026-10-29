// /api/products/:id/reviews — star ratings from customers who ordered the product.
import * as Product from '../models/product.model.js';
import * as Review from '../models/review.model.js';
import { HttpError } from '../utils/HttpError.js';
import { cleanReview } from '../validators/review.validator.js';
import { reviewView } from '../views/review.view.js';

// { reviews, canReview }: canReview says whether the signed-in customer may write one.
async function reviewsOf(productId, user) {
  const reviews = await Review.listForProduct(productId);
  return {
    reviews: reviews.map(row => reviewView(row, user?.id)),
    canReview: Boolean(user) && await Review.hasBought(user.id, productId),
  };
}

// GET — anyone can read reviews, signed in or not.
export async function listReviews(request, response) {
  const product = await Product.findFromParam(request.params.id);
  response.json(await reviewsOf(product.id, request.user));
}

// PUT { rating, comment } — writes or replaces the customer's own review.
export async function saveReview(request, response) {
  const product = await Product.findFromParam(request.params.id);
  const review = cleanReview(request.body);
  if (!await Review.hasBought(request.user.id, product.id)) throw new HttpError(403, 'Only customers who have ordered this product can review it.');
  await Review.save(request.user.id, product.id, review);
  response.json(await reviewsOf(product.id, request.user));
}
