import express from 'express';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { jsonOnly } from './middleware/jsonOnly.middleware.js';
import routes from './routes/index.js';
import { UPLOAD_DIR, UPLOAD_URL } from './utils/uploads.js';

// The whole API. server.js listens with it locally; on Vercel this default export is the entrypoint.
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json());

// Photos uploaded from the admin pages (utils/uploads.js). A name is never reused, so browsers may keep them.
app.use(UPLOAD_URL, express.static(UPLOAD_DIR, { index: false, immutable: true, maxAge: '365d', setHeaders: response => response.set('X-Content-Type-Options', 'nosniff') }));

app.use('/api', jsonOnly, routes, notFound);
app.use(errorHandler);

export default app;
