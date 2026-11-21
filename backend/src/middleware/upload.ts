
import multer from 'multer';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Vercel serverless functions use /tmp for temporary file storage.
// Local development continues using the existing uploads directory.
const uploadDirectory =
  config.env === 'production'
    ? '/tmp'
    : config.storage.localUploadDir;

// Ensure upload directory exists.
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

// Store files using generated names, never the user's original filename.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = ALLOWED_MIME_TYPES[file.mimetype];

    if (!extension) {
      cb(new Error('Unsupported image format.'), '');
      return;
    }

    cb(null, `evidence-${randomUUID()}${extension}`);
  },
});

// Initial MIME type check.
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file format. Only PNG, JPG, JPEG, and WebP images are permitted.'
      )
    );
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
    parts: 12,
  },
});

/**
 * Checks the actual binary signature of an uploaded image.
 * Must run AFTER uploadMiddleware.single(...).
 */
export async function validateUploadedImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const file = req.file;

  if (!file) {
    next();
    return;
  }

  let fileHandle: fs.promises.FileHandle | undefined;

  try {
    fileHandle = await fs.promises.open(file.path, 'r');

    const buffer = Buffer.alloc(12);
    const { bytesRead } = await fileHandle.read(
      buffer,
      0,
      buffer.length,
      0
    );

    const signature = buffer.subarray(0, bytesRead);

    const isPng =
      signature.length >= 8 &&
      signature.subarray(0, 8).equals(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47,
          0x0d, 0x0a, 0x1a, 0x0a,
        ])
      );

    const isJpeg =
      signature.length >= 3 &&
      signature[0] === 0xff &&
      signature[1] === 0xd8 &&
      signature[2] === 0xff;

    const isWebp =
      signature.length >= 12 &&
      signature.toString('ascii', 0, 4) === 'RIFF' &&
      signature.toString('ascii', 8, 12) === 'WEBP';

    const validImage = isPng || isJpeg || isWebp;

    const expectedMimeType = isPng
      ? 'image/png'
      : isJpeg
        ? 'image/jpeg'
        : isWebp
          ? 'image/webp'
          : null;

    if (!validImage || expectedMimeType !== file.mimetype) {
      await fileHandle.close();
      fileHandle = undefined;

      await fs.promises.unlink(file.path).catch(() => undefined);

      res.status(400).json({
        success: false,
        error: 'Uploaded file content does not match a supported image format.',
      });
      return;
    }

    next();
  } catch {
    if (fileHandle) {
      await fileHandle.close().catch(() => undefined);
    }

    await fs.promises.unlink(file.path).catch(() => undefined);

    res.status(400).json({
      success: false,
      error: 'Unable to validate the uploaded image.',
    });
  }
}
