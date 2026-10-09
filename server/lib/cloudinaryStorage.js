// lib/cloudinaryStorage.js
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

function createCloudinaryStorage(
  folder,
  allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif']
) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const base = (file.originalname || 'file')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9-_]/gi, '_')
        .slice(0, 60);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      return {
        folder,
        public_id: `${base}-${unique}`,
        resource_type: 'image',
        allowed_formats: allowedFormats,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      };
    },
  });
}

function createCloudinaryRawStorage(folder) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const base = (file.originalname || 'file')
        .replace(/[^a-z0-9-_.]/gi, '_')
        .slice(0, 60);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      return {
        folder,
        public_id: `${base}-${unique}`,
        resource_type: 'raw',
      };
    },
  });
}

module.exports = { createCloudinaryStorage, createCloudinaryRawStorage };