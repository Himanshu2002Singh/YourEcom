// /api/store — the store's own details, which every page of the storefront shows.
import * as Store from '../models/store.model.js';
import { razorpayReady } from '../utils/razorpay.js';
import { storeView } from '../views/store.view.js';

// GET /api/store — contacts, who the client is, the government buyers, stock photos, categories and policies, and
// whether checkout can take payment online (both Razorpay keys set in backend/.env).
export async function getStore(request, response) {
  response.json({ store: { ...storeView(await Store.details()), onlinePayment: razorpayReady() } });
}
