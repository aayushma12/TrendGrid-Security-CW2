/**
 * Multer config for the CSV bulk-import endpoint — deliberately separate
 * from config/cloudinary.ts's `memoryUploader`, which is image-only. Never
 * touches Cloudinary; the buffer is parsed in-process and discarded.
 */
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

import { BadRequestError } from '../../../utils/errors';

// CSV has no single reliable MIME type across OSes/browsers/HTTP clients —
// curl, Windows Explorer, and various browsers all send different values
// (including the generic fallback below) for the exact same .csv file, so
// the extension is the trustworthy signal here; mimetype is just a sanity check.
const ALLOWED_CSV_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain', 'application/octet-stream'];
const MAX_CSV_BYTES = 5 * 1024 * 1024; // 5MB is generous for a few thousand rows of text

const csvFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const hasCsvExtension = file.originalname.toLowerCase().endsWith('.csv');
  const hasCsvMimeType = ALLOWED_CSV_MIME_TYPES.includes(file.mimetype);
  if (!hasCsvExtension || !hasCsvMimeType) {
    return cb(new BadRequestError(`Invalid file. Expected a .csv file, got "${file.originalname}" (${file.mimetype}).`));
  }
  cb(null, true);
};

export const csvUploader = (): multer.Multer =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_CSV_BYTES, files: 1 },
    fileFilter: csvFileFilter,
  });
