/**
 * Cloudinary SDK configuration + shared Multer MEMORY uploader.
 *
 * Every feature that accepts image uploads uses `memoryUploader()` here and
 * then calls `imageService.uploadImage(buffer, subfolder)` — features NEVER
 * touch the Cloudinary SDK directly.
 */
import { v2 as cloudinary } from 'cloudinary';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

import { env } from './env';
import { BadRequestError } from '../utils/errors';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/** MIME types whitelisted for upload. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg', // covers .jpg and .jpeg
  'image/png',
  'image/webp',
] as const;

const MAX_BYTES = env.cloudinary.maxFileSizeMb * 1024 * 1024;

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return cb(
      new BadRequestError(
        `Invalid image type "${file.mimetype}". Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
      ),
    );
  }
  cb(null, true);
};

/**
 * Multer MEMORY storage — the buffer lands in `req.file.buffer` and
 * the centralized `imageService.uploadImage()` streams it to Cloudinary.
 * NEVER swap this for disk or CloudinaryStorage.
 *
 * @param maxFiles - max number of files accepted in a single request.
 *   Defaults to 1 (single-image uploads). Pass a higher value for
 *   `.array('field', n)` routes (e.g. review/variant gallery uploads) —
 *   it must match the `n` passed to `.array()` or Multer silently caps
 *   at whichever is lower and throws a MulterError (LIMIT_FILE_COUNT)
 *   on the extra files.
 */
export const memoryUploader = (maxFiles = 1): multer.Multer =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES, files: maxFiles },
    fileFilter: imageFileFilter,
  });

export { cloudinary };
