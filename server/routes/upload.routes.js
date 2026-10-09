// routes/upload.routes.js
//
// Image & file uploads → Cloudinary (permanent storage).
//
// Why Cloudinary: Railway's disk is wiped on every deploy/restart, so files
// saved under /uploads disappear and image URLs turn into 404s. Cloudinary
// gives you a permanent https://res.cloudinary.com/... URL.
//
// ── Environment variables ──────────────────────────────────────────────
//   Option A (single URL):
//     CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
//
//   Option B (three separate values):
//     CLOUDINARY_CLOUD_NAME=xxx
//     CLOUDINARY_API_KEY=xxx
//     CLOUDINARY_API_SECRET=xxx
//
//   Optional:
//     CLOUDINARY_FOLDER=genesis-agri      (default: 'genesis-agri')
//
// ── Endpoints ──────────────────────────────────────────────────────────
//   POST /api/upload                 (generic — field: "file" | "image" | "avatar")
//   POST /api/upload/product         (product images — field: "file" | "image")
//   POST /api/upload/products        (multiple — field: "files")
//   POST /api/upload/avatar          (field: "file" | "avatar")
//   POST /api/upload/settings        (field: "file" | "image")
//   POST /api/upload/category        (field: "file" | "image")
//   POST /api/upload/blog            (field: "file" | "image")
//   POST /api/upload/profile         (field: "file" | "image")
//   POST /api/upload/payment         (field: "file" | "image")
//   POST /api/upload/pdf             (field: "file" — PDFs go to 'raw')
//   DELETE /api/upload/:publicId(*)  (delete from Cloudinary)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

/* ────────────────────────────────────────────────────────────────
   AUTH — optional. Comment out the requireAuth arg on each route if
   your current setup doesn't have this middleware yet. It’s safer to
   require authentication for uploads so random people can’t upload.
   ──────────────────────────────────────────────────────────────── */
let requireAuth = (req, res, next) => next();
try {
  requireAuth = require('../middleware/auth').requireAuth || requireAuth;
} catch (err) {
  console.warn(
    '⚠️  middleware/auth not found — /api/upload routes are UNPROTECTED. ' +
      'Add auth middleware in production.'
  );
}

/* ────────────────────────────────────────────────────────────────
   CLOUDINARY CONFIG
   ──────────────────────────────────────────────────────────────── */
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
    // The SDK reads CLOUDINARY_URL automatically — just force HTTPS.
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
} else {
  console.error(
    '❌ Cloudinary is NOT configured. All uploads will fail with 503.\n' +
      '   Set CLOUDINARY_URL OR CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.\n' +
      '   Railway → your service → Variables.'
  );
}

/* ────────────────────────────────────────────────────────────────
   MULTER — memory storage only. Files are streamed to Cloudinary
   and the buffer is released; nothing touches the disk.
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
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  };
}

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: makeFileFilter(IMAGE_TYPES),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: makeFileFilter(PDF_TYPES),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

/* Accepts ONE file from ANY of the common field names. */
const singleImage = imageUpload.fields([
  { name: 'file',   maxCount: 1 },
  { name: 'image',  maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
]);

const manyImages = imageUpload.array('files', 10);
const singlePdf  = pdfUpload.single('file');

/* ────────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────────── */
const randomId = () =>
  `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

function uploadBufferToCloudinary(buffer, { folder, publicId, resourceType = 'image' }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
        invalidate: true,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

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
        error: 'Unexpected field name. Use "file", "image", "avatar", or "files".',
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

function assertCloudinary(res) {
  if (!hasCloudinary) {
    res.status(503).json({
      success: false,
      error:
        'Image storage is not configured. ' +
        'Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET) on the server.',
      code: 'STORAGE_NOT_CONFIGURED',
    });
    return false;
  }
  return true;
}

/* ════════════════════════════════════════════════════════════════
   ROUTES
   ════════════════════════════════════════════════════════════════ */

/* Generic — accepts "file", "image", or "avatar" field */
router.post('/', requireAuth, (req, res) => {
  singleImage(req, res, async (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;
    if (!assertCloudinary(res)) return;

    const file = pickSingleFile(req);
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Send a file under "file", "image", or "avatar".',
        code: 'NO_FILE',
      });
    }

    const isAvatar = file.fieldname === 'avatar';
    const folder   = isAvatar ? 'avatars' : 'uploads';
    const publicId = randomId();

    try {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: `${CLOUD_FOLDER}/${folder}`,
        publicId,
      });
      return res.json({
        success: true,
        url: result.secure_url,
        secure_url: result.secure_url,
        publicId: result.public_id,
        public_id: result.public_id,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        message: isAvatar ? 'Avatar uploaded successfully' : 'File uploaded successfully',
      });
    } catch (e) {
      console.error('❌ Cloudinary error:', e.message || e);
      return res.status(500).json({
        success: false,
        error: 'Failed to store the image. Please try again.',
        code: 'STORAGE_FAILED',
      });
    }
  });
});

/* Product images — single */
router.post('/product', requireAuth, (req, res) => {
  singleImage(req, res, async (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;
    if (!assertCloudinary(res)) return;

    const file = pickSingleFile(req);
    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded', code: 'NO_FILE' });

    try {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: `${CLOUD_FOLDER}/products`,
        publicId: randomId(),
      });
      return res.json({
        success: true,
        url: result.secure_url,
        secure_url: result.secure_url,
        publicId: result.public_id,
        public_id: result.public_id,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
      });
    } catch (e) {
      console.error('❌ Cloudinary error:', e.message || e);
      return res.status(500).json({ success: false, error: 'Failed to store the image.', code: 'STORAGE_FAILED' });
    }
  });
});

/* Product images — multiple (max 10) */
router.post('/products', requireAuth, (req, res) => {
  manyImages(req, res, async (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;
    if (!assertCloudinary(res)) return;

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length)
      return res.status(400).json({ success: false, error: 'No files uploaded', code: 'NO_FILES' });

    try {
      const results = [];
      for (const f of files) {
        const r = await uploadBufferToCloudinary(f.buffer, {
          folder: `${CLOUD_FOLDER}/products`,
          publicId: randomId(),
        });
        results.push({
          url: r.secure_url,
          secure_url: r.secure_url,
          publicId: r.public_id,
          public_id: r.public_id,
          fileName: f.originalname,
          fileSize: f.size,
          fileType: f.mimetype,
        });
      }
      return res.json({ success: true, files: results });
    } catch (e) {
      console.error('❌ Cloudinary error:', e.message || e);
      return res.status(500).json({ success: false, error: 'Failed to store the images.', code: 'STORAGE_FAILED' });
    }
  });
});

/* Avatar */
router.post('/avatar', requireAuth, (req, res) => {
  singleImage(req, res, async (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;
    if (!assertCloudinary(res)) return;

    const file = pickSingleFile(req);
    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded', code: 'NO_FILE' });

    try {
      const result = await uploadBufferToCloudinary(file.buffer, {
        folder: `${CLOUD_FOLDER}/avatars`,
        publicId: randomId(),
      });
      return res.json({
        success: true,
        url: result.secure_url,
        secure_url: result.secure_url,
        publicId: result.public_id,
        public_id: result.public_id,
      });
    } catch (e) {
      console.error('❌ Cloudinary error:', e.message || e);
      return res.status(500).json({ success: false, error: 'Failed to store the avatar.', code: 'STORAGE_FAILED' });
    }
  });
});

/* Folder-scoped single-image endpoints (settings / category / blog / profile / payment) */
function makeFolderRoute(folder) {
  return (req, res) => {
    singleImage(req, res, async (err) => {
      const mErr = handleMulterErrors(err, res);
      if (mErr) return;
      if (!assertCloudinary(res)) return;

      const file = pickSingleFile(req);
      if (!file) return res.status(400).json({ success: false, error: 'No file uploaded', code: 'NO_FILE' });

      try {
        const result = await uploadBufferToCloudinary(file.buffer, {
          folder: `${CLOUD_FOLDER}/${folder}`,
          publicId: randomId(),
        });
        return res.json({
          success: true,
          url: result.secure_url,
          secure_url: result.secure_url,
          publicId: result.public_id,
          public_id: result.public_id,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
        });
      } catch (e) {
        console.error('❌ Cloudinary error:', e.message || e);
        return res.status(500).json({ success: false, error: 'Failed to store the image.', code: 'STORAGE_FAILED' });
      }
    });
  };
}

router.post('/settings', requireAuth, makeFolderRoute('settings'));
router.post('/category', requireAuth, makeFolderRoute('categories'));
router.post('/blog',     requireAuth, makeFolderRoute('blog'));
router.post('/profile',  requireAuth, makeFolderRoute('profiles'));
router.post('/payment',  requireAuth, makeFolderRoute('payments'));

/* PDF upload — resource_type: 'raw' */
router.post('/pdf', requireAuth, (req, res) => {
  singlePdf(req, res, async (err) => {
    const mErr = handleMulterErrors(err, res);
    if (mErr) return;
    if (!assertCloudinary(res)) return;

    if (!req.file)
      return res.status(400).json({ success: false, error: 'No PDF uploaded', code: 'NO_FILE' });

    try {
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: `${CLOUD_FOLDER}/pdfs`,
        publicId: randomId(),
        resourceType: 'raw',
      });
      return res.json({
        success: true,
        url: result.secure_url,
        secure_url: result.secure_url,
        publicId: result.public_id,
        public_id: result.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      });
    } catch (e) {
      console.error('❌ Cloudinary error:', e.message || e);
      return res.status(500).json({ success: false, error: 'Failed to store the PDF.', code: 'STORAGE_FAILED' });
    }
  });
});

/* Delete from Cloudinary */
router.delete('/:publicId(*)', requireAuth, async (req, res) => {
  if (!assertCloudinary(res)) return;
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: 'image',
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('❌ Cloudinary delete error:', err.message || err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;