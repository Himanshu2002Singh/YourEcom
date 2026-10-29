// A coupon shaped like the storefront's Coupon (frontend/src/types/store.ts).
export function couponView(row) {
  return {
    code: row.code,
    kind: row.kind,
    amount: row.amount,
    maxDiscount: row.max_discount,
    minSubtotal: row.min_subtotal,
    firstOrderOnly: Boolean(row.first_order_only),
    expiresAt: row.expires_at && new Date(row.expires_at).toISOString(),
  };
}
