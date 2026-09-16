// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');

// ============================================
// STORAGE SETUP
// ============================================
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const PRODUCT_DIR = path.join(UPLOAD_ROOT, 'products');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');

for (const dir of [UPLOAD_ROOT, PRODUCT_DIR, AVATAR_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route by field name: "avatar" → uploads/avatars, everything else → uploads/products
    const dir = file.fieldname === 'avatar' ? AVATAR_DIR : PRODUCT_DIR;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/svg+xml',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Invalid file type: ${file.mimetype}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ✅ Single middleware that accepts ONE file from EITHER field name.
//    Using .fields() lets multer read the request stream exactly once
//    and decide which field the file arrived on — no fallback chain,
//    no "stream already consumed" issue.
const uploadAny = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
]);

// ============================================
// UPLOAD SINGLE FILE
// POST /api/upload
//
// Accepts either field:
//   - "image"  → saved to uploads/products/
//   - "avatar" → saved to uploads/avatars/
// ============================================
router.post('/', requireAuth, (req, res) => {
  uploadAny(req, res, (err) => {
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
    // req.files is an object like { image: [file], avatar: [file] } when
    // using .fields(). Only one of these will be present.
    const files = req.files || {};
    const file =
      (files.image && files.image[0]) ||
      (files.avatar && files.avatar[0]);

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Send a file under "image" or "avatar".',
        code: 'NO_FILE',
      });
    }

    const isAvatar = file.fieldname === 'avatar';
    const folder = isAvatar ? 'avatars' : 'products';

    return res.json({
      success: true,
      url: `/uploads/${folder}/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      message: isAvatar
        ? 'Avatar uploaded successfully'
        : 'File uploaded successfully',
    });
  });
});

module.exports = router;