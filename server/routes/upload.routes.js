// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/* ────────────────────────────────────────────────────────────────
   AUTH — optional. Comment out the requireAuth arg on each route if
   your current setup doesn't have this middleware yet. It's safer
   to require authentication for uploads so random people can't upload.
   ──────────────────────────────────────────────────────────────── */
let requireAuth = (req, res, next) => next();
try {
  requireAuth =
    require('../middleware/auth').requireAuth ||
    require('../middleware/auth.middleware').requireAuth ||
    requireAuth;
} catch (err) {
  console.warn(
    '⚠️  middleware/auth not found — /api/upload routes are UNPROTECTED. ' +
      'Add auth middleware in production.'
  );
}

/* ────────────────────────────────────────────────────────────────
   LOCAL DISK STORAGE
   Files are saved to:  <server-root>/uploads/<folder>/<filename>
   Served at:           http://<host>:<port>/uploads/<folder>/<filename>
   ──────────────────────────────────────────────────────────────── */
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const ALL_FOLDERS = [
  'products',
  'avatars',
  'categories',
  'settings',
  'blog',
  'profiles',
  'payments',
  'pdfs',
  'uploads',
];

// Create all folders on startup
for (const folder of ALL_FOLDERS) {
  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created upload folder: ${dir}`);
  }
}

/* ────────────────────────────────────────────────────────────────
   MULTER — disk storage. Files are written directly to disk.
   ──────────────────────────────────────────────────────────────── */
const IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

const PDF_TYPES = ['application/pdf'];

function makeFileFilter(allowed) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okMime = allowed.includes(file.mimetype);
    const okExt =
      IMAGE_TYPES.includes(file.mimetype) ||
      /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(ext);
    const okPdf = PDF_TYPES.includes(file.mimetype) || ext === '.pdf';

    if (okMime || okExt || okPdf) return cb(null, true);
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  };
}

/**
 * Build a multer instance that saves files into the given subfolder.
 */
function buildUploader({ subfolder, maxSizeMB = 10, maxFiles = 10, allowed = IMAGE_TYPES }) {
  const destinationDir = path.join(UPLOAD_ROOT, subfolder);

  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      cb(null, unique);
    },
  });

  return multer({
    storage,
    fileFilter: makeFileFilter(allowed),
    limits: { fileSize: maxSizeMB * 1024 * 1024, files: maxFiles },
  });
}

// Default uploaders
const imageUploader = buildUploader({
  subfolder: 'uploads',
  maxSizeMB: 10,
  maxFiles: 10,
  allowed: IMAGE_TYPES,
});

const pdfUploader = buildUploader({
  subfolder: 'pdfs',
  maxSizeMB: 20,
  maxFiles: 1,
  allowed: PDF_TYPES,
});

/* Accepts ONE file from ANY of the common field names. */
const singleImage = imageUploader.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
]);

const manyImages = imageUploader.array('files', 10);
const singlePdf = pdfUploader.single('file');

/* ────────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────────── */
const randomId = () => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

function pickSingleFile(req) {
  if (!req.files || typeof req.files !== 'object') return null;
  const fields = Object.keys(req.files);
  for (const f of fields) {
    if (Array.isArray(req.files[f]) && req.files[f].length > 0) {
      return req.files[f][0];
    }
  }
  return null;
}

/**
 * Given a saved multer file (with `.path` on disk), return the public URL
 * like: /uploads/products/1712-abc.jpg
 */
function fileToUrl(file) {
  if (!file || !file.path) return null;
  const rel = path.relative(UPLOAD_ROOT, file.path).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

function handleMulterErrors(err, res) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).json({
        success: false,
        error: 'File too large.',
        code: 'FILE_TOO_LARGE',
      });
    if (err.code === 'LIMIT_UNEXPECTED_FILE')
      return res.status(400).json({
        success: false,
        error:
          'Unexpected field name. Use "file", "image", "avatar", or "files".',
        code: 'UNEXPECTED_FIELD',
      });
    if (err.code === 'LIMIT_FILE_COUNT')
      return res.status(400).json({
        success: false,
        error: 'Too many files.',
        code: 'TOO_MANY_FILES',
      });
    return res.status(400).json({
      success: false,
      error: err.message || 'Upload failed',
      code: err.code || 'UPLOAD_FAILED',
    });
  }
  if (err) {
    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error:
          'Only image files are allowed (jpeg, png, gif, webp, avif, svg).',
        code: 'INVALID_FILE_TYPE',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message || 'Upload failed',
      code: 'UPLOAD_FAILED',
    });
  }
  return null;
}

/* ════════════════════════════════════════════════════════════════
   ROUTES
   ════════════════════════════════════════════════════════════════ */

/* Generic — accepts "file", "image", or "avatar" field */
router.post('/', requireAuth, (req, res) => {
  singleImage(req, res, async (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;

    const file = pickSingleFile(req);
    if (!file) {
      return res.status(400).json({
        success: false,
        error:
          'No file uploaded. Send a file under "file", "image", or "avatar".',
        code: 'NO_FILE',
      });
    }

    const isAvatar = file.fieldname === 'avatar';
    const url = fileToUrl(file);

    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId: file.filename,
      public_id: file.filename,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      message: isAvatar
        ? 'Avatar uploaded successfully'
        : 'File uploaded successfully',
    });
  });
});

/* Product images — single */
router.post('/product', requireAuth, (req, res) => {
  const uploader = buildUploader({ subfolder: 'products' });
  const mw = uploader.fields([
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]);

  mw(req, res, (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;

    const file = pickSingleFile(req);
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE',
      });
    }

    const url = fileToUrl(file);
    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId: file.filename,
      public_id: file.filename,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    });
  });
});

/* Product images — multiple (max 10) */
router.post('/products', requireAuth, (req, res) => {
  const uploader = buildUploader({ subfolder: 'products', maxFiles: 10 });
  const mw = uploader.array('files', 10);

  mw(req, res, (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        code: 'NO_FILES',
      });
    }

    const results = files.map((f) => ({
      url: fileToUrl(f),
      secure_url: fileToUrl(f),
      publicId: f.filename,
      public_id: f.filename,
      fileName: f.originalname,
      fileSize: f.size,
      fileType: f.mimetype,
    }));

    return res.json({ success: true, files: results });
  });
});

/* Avatar */
router.post('/avatar', requireAuth, (req, res) => {
  const uploader = buildUploader({ subfolder: 'avatars' });
  const mw = uploader.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]);

  mw(req, res, (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;

    const file = pickSingleFile(req);
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE',
      });
    }

    const url = fileToUrl(file);
    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId: file.filename,
      public_id: file.filename,
    });
  });
});

/* Folder-scoped single-image endpoints */
function makeFolderRoute(folder) {
  return (req, res) => {
    const uploader = buildUploader({ subfolder: folder });
    const mw = uploader.fields([
      { name: 'file', maxCount: 1 },
      { name: 'image', maxCount: 1 },
    ]);

    mw(req, res, (err) => {
      const mErr = handleMulterErrors(err, res);
      if (mErr) return;

      const file = pickSingleFile(req);
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          code: 'NO_FILE',
        });
      }

      const url = fileToUrl(file);
      return res.json({
        success: true,
        url,
        secure_url: url,
        publicId: file.filename,
        public_id: file.filename,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
      });
    });
  };
}

router.post('/settings', requireAuth, makeFolderRoute('settings'));
router.post('/category', requireAuth, makeFolderRoute('categories'));
router.post('/blog', requireAuth, makeFolderRoute('blog'));
router.post('/profile', requireAuth, makeFolderRoute('profiles'));
router.post('/payment', requireAuth, makeFolderRoute('payments'));

/* PDF upload */
router.post('/pdf', requireAuth, (req, res) => {
  singlePdf(req, res, (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF uploaded',
        code: 'NO_FILE',
      });
    }

    const url = fileToUrl(req.file);
    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId: req.file.filename,
      public_id: req.file.filename,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    });
  });
});

/* Delete from disk */
router.delete('/:filename', requireAuth, async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename',
        code: 'INVALID_FILENAME',
      });
    }

    // Search for the file across all folders
    let deleted = false;
    for (const folder of ALL_FOLDERS) {
      const filePath = path.join(UPLOAD_ROOT, folder, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      result: 'ok',
      message: 'File deleted successfully',
    });
  } catch (err) {
    console.error('❌ Delete error:', err.message || err);
    return res
      .status(500)
      .json({ success: false, error: err.message || 'Delete failed' });
  }
});

module.exports = router;