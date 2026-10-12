// middleware/upload.js
//
// Upload middlewares that store images on the LOCAL DISK.
// Files are saved to:  <project-root>/uploads/<folder>/<filename>
// and served at:       http://<server>/uploads/<folder>/<filename>
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
// req.files[i].url). It is a relative path like:
//   /uploads/products/1712-abc123.jpg
// The frontend must prepend the API base URL to display it:
//   http://localhost:5000/uploads/products/1712-abc123.jpg

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ── Upload root + subfolders ───────────────────────────────────────────
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

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

// Create all folders on startup
const ALL_FOLDERS = ['products', 'avatars', 'documents', 'receipts', 'articles'];
for (const folder of ALL_FOLDERS) {
  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created upload folder: ${dir}`);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────
const makeError = (code, message) =>
  Object.assign(new Error(message), { code });

// File filter — images + PDFs
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

// ── Disk storage ────────────────────────────────────────────────────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Pick subfolder based on the field name
    const folder = SUBFOLDERS[file.fieldname] || 'products';
    const dir = path.join(UPLOAD_ROOT, folder);

    // Make sure it exists (defensive — it should already)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

// ── Attach a URL to each saved file ─────────────────────────────────────
// After multer writes the file to disk, we compute a public URL and
// attach it to `req.file.url` (and each item of `req.files`).
const attachUrls = (req, res, next) => {
  const addUrl = (file) => {
    if (!file || !file.path) return;
    const rel = path.relative(UPLOAD_ROOT, file.path).split(path.sep).join('/');
    file.url = `/uploads/${rel}`;
    file.location = file.url;
    file.secure_url = file.url;
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

// ── Multer instances ────────────────────────────────────────────────────
const single = multer({
  storage: diskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter,
});

const multiple = multer({
  storage: diskStorage,
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