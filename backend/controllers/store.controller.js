// /api/store — the store's own details, which every page of the storefront shows.
import * as Store from '../models/store.model.js';
import { storeView } from '../views/store.view.js';

// GET /api/store — contacts, who the client is, the government buyers, stock photos, categories and policies.
export async function getStore(request, response) {
  response.json({ store: storeView(await Store.details()) });
}
