// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Clean the original name
    const cleanName = file.originalname
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const validTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif', 
    'image/avif',
    'image/svg+xml'
  ];
  
  const validExtensions = ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.avif', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (validTypes.includes(file.mimetype) || validExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPEG, PNG, WEBP, GIF, AVIF, SVG'));
  }
};

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Maximum 1 file
  },
  fileFilter: fileFilter
});

// For single file upload - expects field name 'image'
const uploadSingle = upload.single('image');

// For multiple documents
const uploadDocuments = upload.array('documents', 5);

// For multiple images
const uploadMultiple = upload.array('images', 5);

// Error handling wrapper
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        // Handle Multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            error: 'File too large. Maximum size is 10MB.',
            code: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            error: 'Unexpected field. Expected field name "image".',
            code: 'UNEXPECTED_FIELD'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            error: 'Too many files.',
            code: 'TOO_MANY_FILES'
          });
        }
        if (err.message && err.message.includes('Invalid file type')) {
          return res.status(400).json({ 
            error: err.message,
            code: 'INVALID_FILE_TYPE'
          });
        }
        // Generic error
        return res.status(400).json({ 
          error: err.message || 'Upload failed',
          code: 'UPLOAD_FAILED'
        });
      }
      next();
    });
  };
};

module.exports = {
  upload,
  uploadSingle,
  uploadDocuments,
  uploadMultiple,
  handleUpload
};