// /api/wishlist — the signed-in customer's saved products. Every answer is the whole list,
// { productIds }, most recently saved first; the storefront already has the products themselves.
import * as Product from '../models/product.model.js';
import * as Wishlist from '../models/wishlist.model.js';

async function sendList(request, response) {
  response.json({ productIds: await Wishlist.productIds(request.user.id) });
}

export const getWishlist = sendList;

// PUT /api/wishlist/:productId
export async function saveProduct(request, response) {
  const product = await Product.findFromParam(request.params.productId);
  await Wishlist.add(request.user.id, product.id);
  await sendList(request, response);
}

// DELETE /api/wishlist/:productId
export async function removeProduct(request, response) {
  const product = await Product.findFromParam(request.params.productId);
  await Wishlist.remove(request.user.id, product.id);
  await sendList(request, response);
}
