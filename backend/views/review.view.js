// A review as shoppers see it. The reviewer shows as first name and last initial
// ("Asha K."), never their email. `mine` marks the signed-in customer's own review.
export function reviewView(row, userId) {
  const [first, ...rest] = row.name.split(' ').filter(Boolean);
  const initial = rest.length ? ` ${rest.at(-1)[0].toUpperCase()}.` : '';
  return {
    name: `${first}${initial}`,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
    mine: row.user_id === userId,
  };
}
