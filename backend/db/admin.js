// Gives an account the admin pages (/admin), or takes them away. There is no way to do this from the site itself,
// so only someone with the server's database can make an admin. The account must exist: sign up on the store first.
// Usage (reads backend/.env):
//   npm run admin                                 lists the admins
//   npm run admin -- owner@example.com            makes that account an admin
//   npm run admin -- owner@example.com --remove   makes it a customer again
import { closeDb, query } from './pool.js';

const [email, option] = process.argv.slice(2);

try {
  if (email) {
    if (option && option !== '--remove') throw new Error(`Unknown option ${option}. Add --remove to take the admin pages away.`);
    const address = email.trim().toLowerCase();
    const [user] = await query('SELECT id, name FROM users WHERE email = ?', [address]);
    if (!user) throw new Error(`No account uses ${address}. Sign up on the store with it first.`);
    const admin = option !== '--remove';
    await query('UPDATE users SET is_admin = ? WHERE id = ?', [admin, user.id]);
    console.log(admin ? `${user.name} (${address}) can now use /admin.` : `${user.name} (${address}) is a customer again.`);
  }
  const admins = await query('SELECT name, email FROM users WHERE is_admin ORDER BY email');
  console.log(admins.length ? `Admins: ${admins.map(({ name, email: address }) => `${name} <${address}>`).join(', ')}` : 'No admins yet. Add one with: npm run admin -- you@example.com');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeDb();
}
