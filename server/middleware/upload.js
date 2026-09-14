// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// Ensure upload directories exist
// ============================================
const productsDir = path.join(__dirname, '../uploads/products');
const avatarsDir = path.join(__dirname, '../uploads/avatars');

[productsDir, avatarsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ============================================
// Helpers
// ============================================
const makeFilename = (prefix, originalName) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  return `${prefix}-${uniqueSuffix}${ext}`;
};

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
  ];

  const validExtensions = [
    '.jpeg',
    '.jpg',
    '.png',
    '.webp',
    '.gif',
    '.avif',
    '.svg',
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (validTypes.includes(file.mimetype) || validExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed: JPEG, PNG, WEBP, GIF, AVIF, SVG'
      )
    );
  }
};

// ============================================
// PRODUCT storage (uploads/products/)
// ============================================
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productsDir);
  },
  filename: function (req, file, cb) {
    cb(null, makeFilename('product', file.originalname));
  },
});

// ============================================
// AVATAR storage (uploads/avatars/)
// ============================================
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    cb(null, makeFilename('avatar', file.originalname));
  },
});

// ============================================
// Multer instances
// ============================================
const uploadProducts = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: fileFilter,
});

const uploadAvatars = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for avatars
    files: 1,
  },
  fileFilter: fileFilter,
});

// ============================================
// Exported middlewares
// ============================================

// Products — expects field name 'image'
const uploadSingle = uploadProducts.single('image');

// Avatars — expects field name 'avatar'
const uploadAvatar = uploadAvatars.single('avatar');

// Multiple documents
const uploadDocuments = uploadProducts.array('documents', 5);

// Multiple images
const uploadMultiple = uploadProducts.array('images', 5);

// ============================================
// Error-handling wrapper
// ============================================
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large. Maximum size is 10MB.',
            code: 'FILE_TOO_LARGE',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            error: 'Unexpected field name in the request.',
            code: 'UNEXPECTED_FIELD',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: 'Too many files.',
            code: 'TOO_MANY_FILES',
          });
        }
        if (err.message && err.message.includes('Invalid file type')) {
          return res.status(400).json({
            error: err.message,
            code: 'INVALID_FILE_TYPE',
          });
        }
        return res.status(400).json({
          error: err.message || 'Upload failed',
          code: 'UPLOAD_FAILED',
        });
      }
      next();
    });
  };
};

module.exports = {
  upload: uploadProducts,   // kept for backward compatibility
  uploadSingle,             // products — field name 'image'
  uploadAvatar,             // ✅ NEW — avatars — field name 'avatar'
  uploadDocuments,
  uploadMultiple,
  handleUpload,
};