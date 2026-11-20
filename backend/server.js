import app from './app.js';
import { ensureAdminAccount } from './services/adminAccount.service.js';

const port = Number(process.env.PORT) || 4000;
const missing = ['DATABASE_URL', 'SESSION_SECRET'].filter(name => !process.env[name]);
if (missing.length) console.warn(`Missing in backend/.env: ${missing.join(', ')}. Features that need them will answer 503.`);

app.listen(port, () => {
  console.log(`YourEcom API on http://localhost:${port}/api`);
  ensureAdminAccount().then(
    note => note && console.log(note),
    error => console.error(`Admin account from backend/.env: ${error.message}`),
  );
});
