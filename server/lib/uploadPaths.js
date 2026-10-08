// lib/uploadPaths.js
const path = require('path');
const os = require('os');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;
const isNetlify = !!(process.env.NETLIFY || process.env.NETLIFY_LOCAL);
const isLambda = !!(
  process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
);

// Netlify Functions run on AWS Lambda, so they are serverless too
const isServerless = isVercel || isNetlify || isLambda;

// Serverless: only the OS temp dir (/tmp) is writable, and it is NOT persistent.
// Local / VPS: normal uploads folder.
const UPLOAD_ROOT = isServerless
  ? path.join(os.tmpdir(), 'uploads')
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

module.exports = {
  UPLOAD_ROOT,
  ensureDir,
  isVercel,
  isNetlify,
  isServerless,
};