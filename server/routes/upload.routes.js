// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/* ────────────────────────────────────────────────────────────────
   AUTH — uses your real middleware/auth.js
   ──────────────────────────────────────────────────────────────── */
const { requireAuth, requireAdmin } = require('../middleware/auth');

/* Debug — remove after confirming it works */
console.log(
  '✅ upload.routes.js → auth loaded:',
  typeof requireAuth === 'function' ? 'requireAuth OK' : 'MISSING',
  '|',
  typeof requireAdmin === 'function' ? 'requireAdmin OK' : 'MISSING'
);

/* ────────────────────────────────────────────────────────────────
   CLOUDINARY CONFIG
   ──────────────────────────────────────────────────────────────── */
const CLOUDINARY_FOLDER_ROOT =
  process.env.CLOUDINARY_FOLDER_ROOT || 'alemayehu-plastic';

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    '⚠️  Cloudinary env vars missing. Set CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env'
  );
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('☁️  Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);
}

/* ────────────────────────────────────────────────────────────────
   FILE-TYPE GUARDS
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

function makeFileFilter(allowed, { allowPdf = false, allowVideo = false } = {}) {
  return (req, file, cb) => {
    const mime = file.mimetype || '';
    const isImage = mime.startsWith('image/');
    const isPdf = PDF_TYPES.includes(mime);
    const isVideo = mime.startsWith('video/');

    const ok =
      (isImage && (allowed.includes(mime) || allowed.length === 0)) ||
      (isPdf && allowPdf) ||
      (isVideo && allowVideo);

    if (ok) return cb(null, true);
    cb(new Error(`Invalid file type: ${mime}`), false);
  };
}

/* ────────────────────────────────────────────────────────────────
   CLOUDINARY STORAGE ENGINE FACTORY
   ──────────────────────────────────────────────────────────────── */
function buildStorage(subfolder) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const mime = file.mimetype || '';
      const isVideo = mime.startsWith('video/');
      const isRaw =
        mime === 'application/pdf' ||
        mime.includes('msword') ||
        mime.includes('officedocument') ||
        mime.includes('octet-stream');

      const baseName = (file.originalname || 'file')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .slice(0, 40);
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

      return {
        folder: `${CLOUDINARY_FOLDER_ROOT}/${subfolder}`,
        public_id: `${baseName}-${uniqueSuffix}`,
        resource_type: isVideo ? 'video' : isRaw ? 'raw' : 'image',
        transformation:
          isVideo || isRaw
            ? undefined
            : [{ quality: 'auto', fetch_format: 'auto' }],
      };
    },
  });
}

function buildUploader({
  subfolder = 'uploads',
  maxSizeMB = 10,
  maxFiles = 10,
  allowed = IMAGE_TYPES,
  allowPdf = false,
  allowVideo = false,
} = {}) {
  return multer({
    storage: buildStorage(subfolder),
    fileFilter: makeFileFilter(allowed, { allowPdf, allowVideo }),
    limits: { fileSize: maxSizeMB * 1024 * 1024, files: maxFiles },
  });
}

/* ────────────────────────────────────────────────────────────────
   PRE-BUILT UPLOADERS
   ──────────────────────────────────────────────────────────────── */
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
  allowed: IMAGE_TYPES,
  allowPdf: true,
});

const singleImage = imageUploader.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
]);

const singlePdf = pdfUploader.single('file');

/* ────────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────────── */
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

function fileToUrl(file) {
  if (!file) return null;
  return file.path || file.secure_url || file.url || null;
}

function fileToPublicId(file) {
  if (!file) return null;
  return file.filename || file.public_id || null;
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
        error: 'Only image files are allowed (jpeg, png, gif, webp, avif, svg).',
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
    const publicId = fileToPublicId(file);

    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId,
      public_id: publicId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      message: isAvatar
        ? 'Avatar uploaded successfully'
        : 'File uploaded successfully',
    });
  });
});

/* Product images — single (ADMIN ONLY) */
router.post('/product', requireAuth, requireAdmin, (req, res) => {
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
    const publicId = fileToPublicId(file);
    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId,
      public_id: publicId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    });
  });
});

/* Product images — multiple (ADMIN ONLY) */
router.post('/products', requireAuth, requireAdmin, (req, res) => {
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
      publicId: fileToPublicId(f),
      public_id: fileToPublicId(f),
      fileName: f.originalname,
      fileSize: f.size,
      fileType: f.mimetype,
    }));

    return res.json({ success: true, files: results });
  });
});

/* Avatar — any logged-in user */
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
    const publicId = fileToPublicId(file);
    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId,
      public_id: publicId,
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
      const publicId = fileToPublicId(file);
      return res.json({
        success: true,
        url,
        secure_url: url,
        publicId,
        public_id: publicId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
      });
    });
  };
}

router.post('/settings',  requireAuth, requireAdmin, makeFolderRoute('settings'));
router.post('/category',  requireAuth, requireAdmin, makeFolderRoute('categories'));
router.post('/blog',      requireAuth, requireAdmin, makeFolderRoute('blog'));
router.post('/profile',   requireAuth, makeFolderRoute('profiles'));
router.post('/payment',   requireAuth, makeFolderRoute('payments'));

/* PDF upload — ADMIN ONLY */
router.post('/pdf', requireAuth, requireAdmin, (req, res) => {
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
    const publicId = fileToPublicId(req.file);
    return res.json({
      success: true,
      url,
      secure_url: url,
      publicId,
      public_id: publicId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    });
  });
});

/* Delete from Cloudinary — ADMIN ONLY */
router.delete('/:publicId(*)', requireAuth, requireAdmin, async (req, res) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId || '');

    if (!publicId || publicId.includes('..')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid public_id',
        code: 'INVALID_PUBLIC_ID',
      });
    }

    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result !== 'ok') {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw',
      });
    }

    if (result.result !== 'ok') {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
      });
    }

    if (result.result !== 'ok') {
      return res.status(404).json({
        success: false,
        error: 'File not found on Cloudinary',
        code: 'FILE_NOT_FOUND',
        result,
      });
    }

    return res.json({
      success: true,
      result: result.result,
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