const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Cloudinary config ───────────────────────────────────────────────────
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER_ROOT = process.env.CLOUDINARY_FOLDER_ROOT || 'alemayehu-plastic';

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.warn(
    '⚠️  Cloudinary env vars missing. Set CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env'
  );
} else {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  console.log('☁️  Cloudinary configured (middleware/upload.js):', CLOUD_NAME);
}

// ── Field → Cloudinary subfolder map ────────────────────────────────────
const SUBFOLDERS = {
  image: 'products',
  images: 'products',
  product: 'products',
  avatar: 'avatars',
  documents: 'documents',
  document: 'documents',
  receipt: 'receipts',
  article: 'articles',
};

// ── Helpers ─────────────────────────────────────────────────────────────
const makeError = (code, message) =>
  Object.assign(new Error(message), { code });

// File filter — images + PDFs (same rules as before)
const fileFilter = (req, file, cb) => {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'application/pdf',
  ];

  const validExtensions = [
    '.jpeg',
    '.jpg',
    '.png',
    '.webp',
    '.gif',
    '.avif',
    '.svg',
    '.pdf',
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (validTypes.includes(file.mimetype) || validExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed: JPEG, PNG, WEBP, GIF, AVIF, SVG, PDF'
      )
    );
  }
};

// ── Cloudinary storage engine ───────────────────────────────────────────
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = SUBFOLDERS[file.fieldname] || 'products';
    const mime = file.mimetype || '';

    const isPdf = mime === 'application/pdf';
    const isVideo = mime.startsWith('video/');
    const isSvg = mime === 'image/svg+xml';

    // Build a friendly public_id from the original filename
    const baseName = (file.originalname || 'file')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    return {
      folder: `${FOLDER_ROOT}/${folder}`,
      public_id: `${baseName}-${uniqueSuffix}`,
      // PDFs / non-image files must use resource_type "raw".
      // SVGs work as "image" but shouldn't be re-encoded.
      resource_type: isVideo ? 'video' : isPdf ? 'raw' : 'image',
      // Skip transformations for PDFs, videos, and SVGs
      transformation:
        isPdf || isVideo || isSvg
          ? undefined
          : [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

// ── Attach a URL to each saved file ─────────────────────────────────────
// With multer-storage-cloudinary, each file already has:
//   file.path       → Cloudinary secure URL
//   file.filename   → Cloudinary public_id
//   file.secure_url → same as path
// We normalise so the rest of the app can rely on `.url`, `.location`,
// `.secure_url`, and `.public_id` regardless of storage backend.
const attachUrls = (req, res, next) => {
  const addUrl = (file) => {
    if (!file) return;
    const url = file.path || file.secure_url || file.url || null;
    const publicId = file.filename || file.public_id || null;

    file.url = url;
    file.location = url;
    file.secure_url = url;
    file.public_id = publicId;
  };

  if (req.file) addUrl(req.file);

  if (Array.isArray(req.files)) {
    req.files.forEach(addUrl);
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((arr) => {
      if (Array.isArray(arr)) arr.forEach(addUrl);
    });
  }
  next();
};

// Compose: multer → attach URLs → next()
const withStorage = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) return next(err);
    return attachUrls(req, res, next);
  });
};

// ── Multer instances (Cloudinary-backed) ────────────────────────────────
const single = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter,
});

const multiple = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB each
    files: 10,
  },
  fileFilter,
});

// ── Exported middlewares ────────────────────────────────────────────────

// Products — field name 'image'
const uploadSingle = withStorage(single.single('image'));

// Avatars — field name 'avatar'
const uploadAvatar = withStorage(single.single('avatar'));

// Multiple documents
const uploadDocuments = withStorage(multiple.array('documents', 5));

// Multiple images
const uploadMultiple = withStorage(multiple.array('images', 5));

// Backward-compatible "upload" object
const upload = {
  single: (field) => withStorage(single.single(field)),
  array: (field, max) => withStorage(multiple.array(field, max)),
  fields: (fields) => withStorage(multiple.fields(fields)),
  any: () => withStorage(multiple.any()),
};

// ── Error-handling wrapper ──────────────────────────────────────────────
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
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
  upload,
  uploadSingle,
  uploadAvatar,
  uploadDocuments,
  uploadMultiple,
  handleUpload,
};