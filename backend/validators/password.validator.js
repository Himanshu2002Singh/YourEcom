// Returns a reason the password can't be used, or '' if it is fine. The minimum matches
// the storefront's sign-up form (frontend/src/pages/LoginPage.tsx).
export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 6) return 'Password must be at least 6 characters.';
  if (password.length > 200) return 'Use a password under 200 characters.';
  return '';
}
