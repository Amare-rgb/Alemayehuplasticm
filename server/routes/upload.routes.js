const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Upload single file
router.post('/', requireAuth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/products/${req.file.filename}`;

    res.json({
      url: fileUrl,
      success: true,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;