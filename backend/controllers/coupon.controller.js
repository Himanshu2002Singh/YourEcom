// /api/coupons — the discount codes the signed-in customer can use at checkout.
import * as Coupon from '../models/coupon.model.js';
import { cleanCouponCode } from '../validators/order.validator.js';
import { couponView } from '../views/coupon.view.js';

// GET /api/coupons — every code this customer can still use, smallest minimum order first.
export async function listCoupons(request, response) {
  response.json({ coupons: (await Coupon.listUsable(request.user.id)).map(couponView) });
}

// GET /api/coupons/:code — the coupon (any case), or why this customer can't use it. The minimum
// order is left to the checkout, which knows the cart; placing the order checks it again.
export async function getCoupon(request, response) {
  const coupon = await Coupon.findUsable(request.user.id, cleanCouponCode(request.params.code));
  response.json({ coupon: couponView(coupon) });
}
