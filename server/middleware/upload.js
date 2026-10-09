// middleware/upload.js
//
// Upload middlewares that store images on Cloudinary (permanent storage)
// instead of Railway's disk (which is erased on every deploy).
//
// Same exports and field names as before:
//   uploadSingle     → field "image"      (products)
//   uploadAvatar     → field "avatar"     (avatars)
//   uploadDocuments  → field "documents"  (up to 5)
//   uploadMultiple   → field "images"     (up to 5)
//   upload           → object with .single() / .array() / .fields() / .any()
//   handleUpload     → error-handling wrapper
//
// IMPORTANT: after a successful upload, use  req.file.url  (or
// req.files[i].url) as the image address. In production it is a permanent
// https://res.cloudinary.com/... link. Do NOT build "/uploads/..." paths
// from file.filename any more.
//
// Railway variables:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
//   (or CLOUDINARY_URL), optional CLOUDINARY_FOLDER

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');
const { ensureDir } = require('../lib/uploadPaths');

const isProd = process.env.NODE_ENV === 'production';

// ============================================
// Cloudinary setup
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
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
}

// ============================================
// Helpers
// ============================================
const makeError = (code, message) =>
  Object.assign(new Error(message), { code });

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

// Collect every uploaded file, whatever multer mode was used
const collectFiles = (req) => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === 'object') {
    return Object.values(req.files).flat();
  }
  return [];
};

// Send one file (held in memory) to permanent storage
// and add  url / path / filename / publicId  to the multer file object.
const storeFile = async (file) => {
  const isAvatar = file.fieldname === 'avatar';
  const folder = isAvatar ? 'avatars' : 'products';
  const prefix = isAvatar ? 'avatar' : 'product';
  const baseName = `${prefix}-${Date.now()}-${crypto
    .randomBytes(6)
    .toString('hex')}`;

  if (hasCloudinary) {
    try {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: `${CLOUD_FOLDER}/${folder}`,
        publicId: baseName,
      });
      file.url = result.secure_url;
      file.path = result.secure_url;
      file.publicId = result.public_id;
      file.filename = baseName;
      return;
    } catch (err) {
      console.error(
        '❌ Cloudinary upload failed:',
        err && err.message ? err.message : err
      );
      throw makeError('STORAGE_FAILED', 'Failed to store the image.');
    }
  }

  if (!isProd) {
    // Development fallback: local disk
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const dir = ensureDir(folder);
    const filename = `${baseName}${ext}`;
    await fs.promises.writeFile(path.join(dir, filename), file.buffer);
    file.url = `/uploads/${folder}/${filename}`;
    file.path = path.join(dir, filename);
    file.publicId = null;
    file.filename = filename;
    return;
  }

  throw makeError(
    'STORAGE_NOT_CONFIGURED',
    'Image storage is not configured on the server.'
  );
};

// multer (memory) + storeFile → one normal (req, res, next) middleware
const withStorage = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, async (err) => {
    if (err) return next(err);
    try {
      const files = collectFiles(req);
      for (const file of files) {
        await storeFile(file);
      }
      return next();
    } catch (storageErr) {
      return next(storageErr);
    }
  });
};

// ============================================
// Multer instances (files are kept in memory first)
// ============================================
const memoryProducts = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter,
});

const memoryAvatars = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for avatars
    files: 1,
  },
  fileFilter,
});

// Several files at once (previously limited to 1 by mistake)
const memoryMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB each
    files: 5,
  },
  fileFilter,
});

// ============================================
// Exported middlewares
// ============================================

// Products — expects field name 'image'
const uploadSingle = withStorage(memoryProducts.single('image'));

// Avatars — expects field name 'avatar'
const uploadAvatar = withStorage(memoryAvatars.single('avatar'));

// Multiple documents
const uploadDocuments = withStorage(memoryMultiple.array('documents', 5));

// Multiple images
const uploadMultiple = withStorage(memoryMultiple.array('images', 5));

// Backward compatible "upload" object: upload.single('x'), upload.array('x', 3), ...
const upload = {
  single: (field) => withStorage(memoryProducts.single(field)),
  array: (field, max) => withStorage(memoryMultiple.array(field, max)),
  fields: (fields) => withStorage(memoryMultiple.fields(fields)),
  any: () => withStorage(memoryMultiple.any()),
};

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
        if (err.code === 'STORAGE_NOT_CONFIGURED') {
          return res.status(503).json({
            error:
              'Image storage is not configured on the server. Please contact the administrator.',
            code: 'STORAGE_NOT_CONFIGURED',
          });
        }
        if (err.code === 'STORAGE_FAILED') {
          return res.status(500).json({
            error: 'Failed to store the image. Please try again.',
            code: 'STORAGE_FAILED',
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
  upload, // kept for backward compatibility (.single / .array / .fields / .any)
  uploadSingle, // products — field name 'image'
  uploadAvatar, // avatars — field name 'avatar'
  uploadDocuments,
  uploadMultiple,
  handleUpload,
};