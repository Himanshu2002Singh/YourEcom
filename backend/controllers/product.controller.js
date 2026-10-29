// /api/products — the catalogue, open to everyone whether signed in or not.
import * as Product from '../models/product.model.js';
import { cleanProductQuery } from '../validators/product.validator.js';
import { productView } from '../views/product.view.js';

// GET /api/products?category=Gloves&q=nitrile — both filters are optional.
export async function listProducts(request, response) {
  const products = await Product.list(cleanProductQuery(request.query));
  response.json({ products: products.map(productView) });
}

export async function getProduct(request, response) {
  response.json({ product: productView(await Product.findFromParam(request.params.id)) });
}
