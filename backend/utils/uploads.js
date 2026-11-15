// Product photos uploaded from the admin pages (POST /api/admin/uploads). They are kept in UPLOAD_DIR
// (backend/uploads unless set; on a server it must be a disk that survives restarts and deploys) and served
// at /api/uploads/<name> by app.js. They are never deleted: old orders keep the photo they were placed with.
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from './HttpError.js';

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || fileURLToPath(new URL('../uploads', import.meta.url)));
export const UPLOAD_URL = '/api/uploads';
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_UPLOAD = 8;

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// What a file really is, from its first bytes, since the name and type a browser sends can say anything:
// 'jpg', 'png' or 'webp', or null for anything else (SVG included, which can carry scripts).
export function photoType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG)) return 'png';
  if (buffer.length >= 12 && buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

// Saves multer's in-memory files under new random names and answers their URLs, in the order they were sent.
// Nothing is saved unless every file is a photo.
export async function savePhotos(files = []) {
  if (!files.length) throw new HttpError(400, 'Choose at least one photo.');
  const photos = files.map(file => ({ file, type: photoType(file.buffer) }));
  const other = photos.find(({ type }) => !type);
  if (other) throw new HttpError(400, `${other.file.originalname} isn’t a JPEG, PNG or WebP photo.`);
  await mkdir(UPLOAD_DIR, { recursive: true });
  return Promise.all(
    photos.map(async ({ file, type }) => {
      const name = `${randomBytes(12).toString('hex')}.${type}`;
      await writeFile(path.join(UPLOAD_DIR, name), file.buffer, { flag: 'wx' });
      return `${UPLOAD_URL}/${name}`;
    }),
  );
}
