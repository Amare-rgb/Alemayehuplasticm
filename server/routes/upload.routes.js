// routes/upload.routes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const path = require('path');

// Upload single file - FIXED with proper error handling
router.post('/', requireAuth, (req, res) => {
  // Use uploadSingle middleware with error handling wrapper
  uploadSingle(req, res, function (err) {
    // Handle Multer errors
    if (err) {
      console.error('Upload error:', err);
      
      // Handle specific Multer error codes
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File too large. Maximum size is 5MB.',
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
          error: 'Too many files. Maximum 1 file allowed.',
          code: 'TOO_MANY_FILES'
        });
      }
      
      if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({ 
          error: 'Only image files are allowed (jpeg, jpg, png, gif, webp, svg).',
          code: 'INVALID_FILE_TYPE'
        });
      }
      
      // Generic error
      return res.status(400).json({ 
        error: err.message || 'Upload failed',
        code: 'UPLOAD_FAILED'
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    try {
      // Construct the file URL - using the correct path
      const fileUrl = `/uploads/products/${req.file.filename}`;

      // Return success response with file details
      res.json({
        success: true,
        url: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        message: 'File uploaded successfully'
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      res.status(500).json({ 
        error: 'Failed to process uploaded file',
        code: 'PROCESSING_ERROR'
      });
    }
  });
});

module.exports = router;