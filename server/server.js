// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ✅ Shared Prisma client (singleton)
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ═══════════════════════════════════════════════════════════
// TRUST PROXY (Render / Railway / nginx / ngrok)
// ═══════════════════════════════════════════════════════════
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════
// IMPORT ROUTES
// ═══════════════════════════════════════════════════════════
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const adminDashboardRoutes = require('./routes/admin.dashboard');
const blogRoutes = require('./routes/blog.routes');
const cartRoutes = require('./routes/cart.routes');
const categoriesRoutes = require('./routes/categories.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const ordersRoutes = require('./routes/orders.routes');
const productsRoutes = require('./routes/products.routes');
const uploadRoutes = require('./routes/upload.routes');
const usersRoutes = require('./routes/users.routes');
const settingsRoutes = require('./routes/settings.routes');
const profileRoutes = require('./routes/profile.routes');
const articlesRoutes = require('./routes/articles.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const telebirrRoutes = require('./routes/telebirr.routes');

// ═══════════════════════════════════════════════════════════
// ENSURE UPLOAD DIRECTORIES EXIST
// ═══════════════════════════════════════════════════════════
const uploadsDir = path.join(__dirname, 'uploads');
const productsDir = path.join(uploadsDir, 'products');
const settingsDir = path.join(uploadsDir, 'settings');
const pdfsDir = path.join(uploadsDir, 'pdfs');

[uploadsDir, productsDir, settingsDir, pdfsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('✅ Created directory:', dir);
  }
});

// ═══════════════════════════════════════════════════════════
// CORS — localhost + Vercel + ngrok + custom origins
// ═══════════════════════════════════════════════════════════
const stripSlash = (o) => String(o).trim().replace(/\/+$/, '');

// Comma-separated extra origins: ALLOWED_ORIGINS=https://a.com,https://b.com
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  ...extraOrigins,
].filter(Boolean);

const allowedOrigins = new Set(rawOrigins.map(stripSlash));

// Any Vercel deployment (production + preview URLs)
const VERCEL_REGEX = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i;
// ngrok (old + new domains), dev only
const NGROK_REGEX = /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.ngrok(-free)?\.(io|app|dev)$/i;
// Local network, dev only
const LAN_REGEX =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

function isOriginAllowed(origin) {
  if (!origin) return true; // curl, Postman, server-to-server
  const cleaned = stripSlash(origin);

  if (allowedOrigins.has(cleaned)) return true;
  if (VERCEL_REGEX.test(cleaned)) return true;

  if (!isProd) {
    if (NGROK_REGEX.test(cleaned)) return true;
    if (LAN_REGEX.test(cleaned)) return true;
  }
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    // Do NOT throw an Error here (that caused the 403 on preflight)
    console.warn(`⚠️ CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'ngrok-skip-browser-warning',
  ],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// The cors middleware answers OPTIONS preflight automatically,
// so there is no need for app.options('*', ...)
app.use(cors(corsOptions));

// ═══════════════════════════════════════════════════════════
// BODY PARSERS
// ═══════════════════════════════════════════════════════════
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ═══════════════════════════════════════════════════════════
// STATIC FILES
// ═══════════════════════════════════════════════════════════
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  })
);

console.log('✅ Serving static files from:', uploadsDir);

// ═══════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const userCount = await prisma.user.count();
    console.log(`📊 Database contains ${userCount} users`);

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      console.log('👤 Admin user exists:', adminUser.email);
    } else {
      console.log('⚠️ No admin user found. Please create one.');
    }
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your DATABASE_URL in .env file');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/telebirr', telebirrRoutes);

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      backendUrl: process.env.BACKEND_URL || `http://localhost:${PORT}`,
      database: { connected: true, userCount },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: { connected: false, error: error.message },
    });
  }
});

// ═══════════════════════════════════════════════════════════
// ROOT ROUTE
// ═══════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    name: 'Genesis Agri API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      adminDashboard: '/api/admin/dashboard',
      articles: '/api/articles',
      blog: '/api/blog',
      cart: '/api/cart',
      categories: '/api/categories',
      chatbot: '/api/chatbot',
      checkout: '/api/checkout',
      orders: '/api/orders',
      products: '/api/products',
      upload: '/api/upload',
      users: '/api/users',
      profile: '/api/profile',
      settings: '/api/admin/settings',
      health: '/api/health',
      telebirrNotify: '/api/telebirr/notify',
      telebirrReturn: '/api/telebirr/return',
    },
  });
});

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════
app.use((req, res) => {
  console.log('❌ Route not found:', req.method, req.url);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url,
    method: req.method,
  });
});

// ═══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payment proof file is too large. Please upload a file under 10 MB.',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ═══════════════════════════════════════════════════════════
// SERVER STARTUP + GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════
let server;

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ HTTP server closed');
    }
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function startServer() {
  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    console.log('⚠️ Server starting without database connection.');
  }

  server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    console.log('\n🌱 Genesis Agri Server running on ' + backendUrl);
    console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('💾 Database: ' + (dbConnected ? 'Connected ✅' : 'Not Connected ⚠️'));
    console.log('🔓 Allowed CORS origins:');
    allowedOrigins.forEach((o) => console.log('   - ' + o));
    console.log('   - *.vercel.app');
  });
}

startServer();

module.exports = app;