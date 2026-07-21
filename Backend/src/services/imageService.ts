/**
 * Centralized Cloudinary image service.
 *
 * The ONLY place features go to persist / replace / remove an image.
 * Always:
 *   - streams from a Multer memory buffer
 *   - applies `quality: auto` + `fetch_format: auto`
 *   - uploads under `{env.cloudinary.folder}/{subfolder}` (e.g. fashion-store/categories)
 *   - returns only `publicId` + `secureUrl` — these are what the DB stores
 *   - logs every upload and delete
 */
import { UploadApiResponse } from 'cloudinary';

import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { HTTP_STATUS } from '../constants';

export interface StoredImage {
  publicId: string;
  secureUrl: string;
}

const buildFolder = (subfolder: string): string => {
  const base = env.cloudinary.folder;
  const clean = subfolder.replace(/^\/+|\/+$/g, '');
  return clean ? `${base}/${clean}` : base;
};

/**
 * Upload a buffer to Cloudinary. Applies standard transformations.
 * @throws AppError(500) on Cloudinary failure.
 */
export const uploadImage = async (
  buffer: Buffer,
  subfolder: string,
): Promise<StoredImage> => {
  const folder = buildFolder(subfolder);

  return new Promise<StoredImage>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (err, result: UploadApiResponse | undefined) => {
        if (err || !result) {
          logger.error(`Cloudinary upload failed folder=${folder} err=${err?.message}`);
          return reject(
            new AppError(
              'Image upload failed',
              HTTP_STATUS.INTERNAL_SERVER_ERROR,
              [{ message: err?.message ?? 'Unknown upload error' }],
            ),
          );
        }

        logger.info(
          `Cloudinary upload OK folder=${folder} publicId=${result.public_id} bytes=${result.bytes}`,
        );
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      },
    );
    stream.end(buffer);
  });
};

/**
 * Delete an image by publicId. Non-throwing — logs on failure so business
 * flows (delete parent entity) do not abort if the asset is already gone.
 */
export const deleteImage = async (publicId: string | null | undefined): Promise<void> => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result === 'not found') {
      logger.warn(`Cloudinary delete: asset already gone publicId=${publicId}`);
      return;
    }
    logger.info(`Cloudinary delete OK publicId=${publicId} result=${result.result}`);
  } catch (err) {
    logger.warn(`Cloudinary delete failed publicId=${publicId}: ${(err as Error).message}`);
  }
};

/**
 * Replace an existing image atomically: upload the new one first, then
 * delete the old one only if the upload succeeded.
 * If oldPublicId is null/undefined this is equivalent to uploadImage.
 */
export const replaceImage = async (
  oldPublicId: string | null | undefined,
  buffer: Buffer,
  subfolder: string,
): Promise<StoredImage> => {
  const stored = await uploadImage(buffer, subfolder);
  if (oldPublicId && oldPublicId !== stored.publicId) {
    await deleteImage(oldPublicId);
  }
  return stored;
};

/**
 * Build an on-the-fly optimized delivery URL. `secureUrl` from the DB is
 * already usable; this is only when a specific size/crop is needed at render
 * time (e.g. thumbnails).
 */
export const buildOptimizedUrl = (
  publicId: string,
  opts: { width?: number; height?: number; quality?: 'auto' | number } = {},
): string =>
  cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: opts.quality ?? 'auto',
    width: opts.width,
    height: opts.height,
    crop: opts.width || opts.height ? 'fill' : undefined,
  });
