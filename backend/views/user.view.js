// JSON the browser may see about the signed-in customer, shaped like the storefront's User
// (frontend/src/types/store.ts). The password hash never leaves the server.
export function userView(row) {
  return {
    name: row.name,
    email: row.email,
    memberSince: new Date(row.created_at).getUTCFullYear(),
    preferences: { smsUpdates: Boolean(row.sms_updates), offers: Boolean(row.offers) },
  };
}
