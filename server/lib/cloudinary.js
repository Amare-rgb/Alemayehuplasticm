// lib/cloudinary.js
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
  .filter((k) => !process.env[k]);

if (missing.length) {
  console.error(
    `❌ Missing Cloudinary env vars: ${missing.join(', ')}. Uploads will fail.`
  );
}

module.exports = cloudinary;