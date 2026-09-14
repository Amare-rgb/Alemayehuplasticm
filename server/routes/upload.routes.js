// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { uploadSingle, uploadAvatar } = require('../middleware/upload');

// ============================================
// UPLOAD SINGLE FILE
// POST /api/upload
//
// Accepts either field:
//   - "image"  → saved to uploads/products/
//   - "avatar" → saved to uploads/avatars/
// ============================================
router.post('/', requireAuth, (req, res) => {
  // Try the avatar middleware first (field name "avatar").
  // If the request used "image", multer returns LIMIT_UNEXPECTED_FILE
  // and we fall back to the product upload middleware.
  uploadAvatar(req, res, (avatarErr) => {
    // ✅ Avatar upload succeeded
    if (!avatarErr && req.file) {
      return res.json({
        success: true,
        url: `/uploads/avatars/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        message: 'Avatar uploaded successfully',
      });
    }

    // Not an avatar — try product image
    uploadSingle(req, res, (imgErr) => {
      if (imgErr) {
        console.error('Upload error:', imgErr);

        if (imgErr.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large. Maximum size is 10MB.',
            code: 'FILE_TOO_LARGE',
          });
        }

        if (imgErr.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            error:
              'Unexpected field name. Send the file under "image" or "avatar".',
            code: 'UNEXPECTED_FIELD',
          });
        }

        if (imgErr.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: 'Too many files. Maximum 1 file allowed.',
            code: 'TOO_MANY_FILES',
          });
        }

        if (imgErr.message && imgErr.message.includes('Invalid file type')) {
          return res.status(400).json({
            error:
              'Only image files are allowed (jpeg, jpg, png, gif, webp, avif, svg).',
            code: 'INVALID_FILE_TYPE',
          });
        }

        return res.status(400).json({
          error: imgErr.message || 'Upload failed',
          code: 'UPLOAD_FAILED',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          code: 'NO_FILE',
        });
      }

      // ✅ Product image upload succeeded
      res.json({
        success: true,
        url: `/uploads/products/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        message: 'File uploaded successfully',
      });
    });
  });
});

module.exports = router;