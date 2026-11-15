import { HttpError } from '../utils/HttpError.js';

export function notFound(request, response) {
  response.status(404).json({ error: 'Not found.' });
}

// Express 5 forwards rejected promises here, so controllers can simply `throw new HttpError(...)`.
export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  if (error instanceof HttpError) return response.status(error.status).json({ error: error.message });
  if (error?.type === 'entity.too.large') return response.status(413).json({ error: 'That request is too large.' });
  if (error?.type === 'entity.parse.failed') return response.status(400).json({ error: 'The request wasn’t valid JSON.' });
  // Photo uploads (routes/admin.routes.js) that break multer's limits.
  if (error?.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') return response.status(413).json({ error: 'Each photo must be under 5 MB.' });
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') return response.status(400).json({ error: 'Upload up to 8 photos at a time.' });
    return response.status(400).json({ error: 'That upload couldn’t be read. Try again.' });
  }
  console.error(error);
  return response.status(500).json({ error: 'Something went wrong on our side. Try again in a moment.' });
}
