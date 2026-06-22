import multer from 'multer';
import type { Request } from 'express';
import { badRequest } from '../utils/apiError';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowedMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
  ]);

  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }

  cb(null, true);
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5,
  },
  fileFilter,
});

export function uploadErrorHandler(err: unknown, req: Request, res: any, next: any) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return badRequest(res, 'File too large. Max allowed size is 5MB.');
    }
    return badRequest(res, `Upload error: ${err.message}`);
  }

  if (err instanceof Error) {
    return badRequest(res, err.message);
  }

  return badRequest(res, 'Unknown upload error');
}
