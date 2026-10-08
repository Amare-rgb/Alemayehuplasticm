// lib/uploadPaths.js
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;

// Vercel: only /tmp is writable. Local / VPS: normal uploads folder.
const UPLOAD_ROOT = isVercel
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'uploads');

function ensureDir(...parts) {
  const dir = path.join(UPLOAD_ROOT, ...parts);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    // Never crash the whole server because of a folder
    console.warn('⚠️ Could not create directory:', dir, err.message);
  }
  return dir;
}

module.exports = { UPLOAD_ROOT, ensureDir, isVercel };