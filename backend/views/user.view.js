// JSON the browser may see about the signed-in customer, shaped like the storefront's User
// (frontend/src/types/store.ts). The password hash never leaves the server; hasPassword says whether there is one
// (an account made with Google has none until the customer sets one).
export function userView(row) {
  return {
    name: row.name,
    email: row.email,
    memberSince: new Date(row.created_at).getUTCFullYear(),
    hasPassword: Boolean(row.password_hash),
    preferences: { smsUpdates: Boolean(row.sms_updates), offers: Boolean(row.offers) },
  };
}
