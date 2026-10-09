// routes/upload.routes.js
//
// Image uploads → Cloudinary (permanent storage).
//
// Why: Railway's disk is erased on every deploy/restart, so files saved to
// /uploads disappear and product images turn into 404s.
//
// Railway variables (either option A or B):
//   A) CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
//   B) CLOUDINARY_CLOUD_NAME=...
//      CLOUDINARY_API_KEY=...
//      CLOUDINARY_API_SECRET=...
//   Optional: CLOUDINARY_FOLDER=genesis-agri
//
// In development (NODE_ENV !== 'production') with no Cloudinary variables,
// it still saves to the local uploads/ folder so local work keeps running.
// In production without Cloudinary it returns a clear error instead of
// silently saving files that will be deleted.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');
const { requireAuth } = require('../middleware/auth');
const { ensureDir } = require('../lib/uploadPaths');

const isProd = process.env.NODE_ENV === 'production';

// ============================================
// CLOUDINARY SETUP
// ============================================
const hasCloudinary = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET)
);

const CLOUD_FOLDER = (process.env.CLOUDINARY_FOLDER || 'genesis-agri')
  .trim()
  .replace(/^\/+|\/+$/g, '');

if (hasCloudinary) {
  if (process.env.CLOUDINARY_URL) {
    // The SDK reads CLOUDINARY_URL by itself; just force https links.
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  console.log('☁️  Cloudinary image storage enabled');
} else if (isProd) {
  console.error(
    '❌ Cloudinary is NOT configured. Image uploads will fail in production. ' +
      'Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).'
  );
} else {
  console.warn(
    '⚠️  Cloudinary not configured → using local uploads/ folder (development only).'
  );
}

// ============================================
// MULTER (files are kept in memory, then sent to Cloudinary)
// ============================================
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Invalid file type: ${file.mimetype}`), false);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB
});

// One middleware that accepts ONE file from EITHER field name.
const uploadAny = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
]);

// ============================================
// HELPERS
// ============================================
const uploadBufferToCloudinary = (buffer, { folder, publicId }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });

// ============================================
// UPLOAD SINGLE FILE
// POST /api/upload
//
// Accepts either field:
//   - "image"  → products
//   - "avatar" → avatars
//
// Returns { success, url, ... } where url is a permanent
// https://res.cloudinary.com/... link.
// ============================================
router.post('/', requireAuth, (req, res) => {
  uploadAny(req, res, async (err) => {
    // ── Multer errors ──
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err.code, err.message);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 10MB.',
          code: 'FILE_TOO_LARGE',
        });
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          error: 'Unexpected field name. Send the file under "image" or "avatar".',
          code: 'UNEXPECTED_FIELD',
        });
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 1 file allowed.',
          code: 'TOO_MANY_FILES',
        });
      }

      return res.status(400).json({
        success: false,
        error: err.message || 'Upload failed',
        code: err.code || 'UPLOAD_FAILED',
      });
    }

    // ── Non-multer errors (e.g. fileFilter rejection) ──
    if (err) {
      console.error('Upload error:', err);
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          error:
            'Only image files are allowed (jpeg, jpg, png, gif, webp, avif, svg).',
          code: 'INVALID_FILE_TYPE',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'Upload failed',
        code: 'UPLOAD_FAILED',
      });
    }

    // ── Pick the file from whichever field was used ──
    const files = req.files || {};
    const file =
      (files.image && files.image[0]) || (files.avatar && files.avatar[0]);

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Send a file under "image" or "avatar".',
        code: 'NO_FILE',
      });
    }

    const isAvatar = file.fieldname === 'avatar';
    const folder = isAvatar ? 'avatars' : 'products';
    const baseName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    try {
      let url;
      let publicId = null;

      if (hasCloudinary) {
        // ✅ Permanent storage
        const result = await uploadBufferToCloudinary(file.buffer, {
          folder: `${CLOUD_FOLDER}/${folder}`,
          publicId: baseName,
        });
        url = result.secure_url;
        publicId = result.public_id;
      } else if (!isProd) {
        // Development fallback: local disk
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const dir = ensureDir(folder);
        const filename = `${baseName}${ext}`;
        await fs.promises.writeFile(path.join(dir, filename), file.buffer);
        url = `/uploads/${folder}/${filename}`;
      } else {
        return res.status(503).json({
          success: false,
          error:
            'Image storage is not configured on the server. Please contact the administrator.',
          code: 'STORAGE_NOT_CONFIGURED',
        });
      }

      return res.json({
        success: true,
        url,
        publicId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        message: isAvatar
          ? 'Avatar uploaded successfully'
          : 'File uploaded successfully',
      });
    } catch (storageErr) {
      console.error(
        '❌ Image storage error:',
        storageErr && storageErr.message ? storageErr.message : storageErr
      );
      return res.status(500).json({
        success: false,
        error: 'Failed to store the image. Please try again.',
        code: 'STORAGE_FAILED',
      });
    }
  });
});

module.exports = router;