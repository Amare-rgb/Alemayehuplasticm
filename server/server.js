// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

// ✅ Shared Prisma client (singleton)
const prisma = require('./lib/prisma');
const { UPLOAD_ROOT, ensureDir } = require('./lib/uploadPaths');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ✅ Detect ANY serverless platform (Netlify, Vercel, AWS Lambda)
const isNetlify = !!(process.env.NETLIFY || process.env.NETLIFY_LOCAL);
const isVercel = !!process.env.VERCEL;
const isServerless =
  isNetlify || isVercel || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// ═══════════════════════════════════════════════════════════
// TRUST PROXY
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
// UPLOAD DIRECTORIES (skip entirely on serverless: read-only disk)
// ═══════════════════════════════════════════════════════════
if (!isServerless) {
  ['products', 'settings', 'pdfs', 'avatars'].forEach((d) => ensureDir(d));
}

// ═══════════════════════════════════════════════════════════
// CORS — localhost + Vercel + Netlify + ngrok + custom origins
// ═══════════════════════════════════════════════════════════
const stripSlash = (o) => String(o).trim().replace(/\/+$/, '');

const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.URL, // Netlify: main site URL (auto-set)
    process.env.DEPLOY_PRIME_URL, // Netlify: current deploy URL (auto-set)
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8888', // netlify dev
    'http://127.0.0.1:3000',
    ...extraOrigins,
  ]
    .filter(Boolean)
    .map(stripSlash)
);

const VERCEL_REGEX = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i;
const NETLIFY_REGEX = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.netlify\.app$/i;
const NGROK_REGEX = /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.ngrok(-free)?\.(io|app|dev)$/i;
const LAN_REGEX =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

function isOriginAllowed(origin) {
  if (!origin) return true; // curl, Postman, server-to-server
  const cleaned = stripSlash(origin);

  if (allowedOrigins.has(cleaned)) return true;
  if (VERCEL_REGEX.test(cleaned)) return true;
  if (NETLIFY_REGEX.test(cleaned)) return true;

  if (!isProd) {
    if (NGROK_REGEX.test(cleaned)) return true;
    if (LAN_REGEX.test(cleaned)) return true;
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
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
  })
);

// ═══════════════════════════════════════════════════════════
// BODY PARSERS
// NOTE: Netlify Functions have a ~6 MB request payload limit.
// Use direct-to-Cloudinary uploads for anything larger.
// ═══════════════════════════════════════════════════════════
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ═══════════════════════════════════════════════════════════
// STATIC FILES (local/VPS only; serverless disk is not persistent)
// ═══════════════════════════════════════════════════════════
if (!isServerless) {
  app.use(
    '/uploads',
    express.static(UPLOAD_ROOT, {
      setHeaders: (res, filePath) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    })
  );
}

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin/dashboard', adminDashboardRoutes); // more specific first
apiRouter.use('/admin/settings', settingsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/blog', blogRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/checkout', checkoutRoutes);
apiRouter.use('/orders', ordersRoutes);
apiRouter.use('/products', productsRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/articles', articlesRoutes);
apiRouter.use('/chatbot', chatbotRoutes);
apiRouter.use('/telebirr', telebirrRoutes);

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════
apiRouter.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: isNetlify ? 'netlify' : isVercel ? 'vercel' : 'node',
      database: { connected: true, userCount },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: { connected: false, error: error.message },
    });
  }
});

// Mount the SAME router at /api (normal) and at the Netlify function path
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

// ═══════════════════════════════════════════════════════════
// ROOT ROUTE
// ═══════════════════════════════════════════════════════════
const rootInfo = (req, res) => {
  res.json({
    name: 'Genesis Agri API Server',
    version: '1.0.0',
    status: 'Running',
    platform: isNetlify ? 'netlify' : isVercel ? 'vercel' : 'node',
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
};
app.get('/', rootInfo);
app.get('/api', rootInfo);

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
      error: 'File is too large. Please upload a file under 5 MB.',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ═══════════════════════════════════════════════════════════
// STARTUP — only when NOT serverless.
// On Netlify, netlify/functions/api.js wraps the exported `app`.
// ═══════════════════════════════════════════════════════════
if (!isServerless) {
  let server;

  const gracefulShutdown = async (signal) => {
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
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  (async () => {
    let dbConnected = false;
    try {
      await prisma.$connect();
      dbConnected = true;
      const userCount = await prisma.user.count();
      console.log(`✅ Database connected (${userCount} users)`);

      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      console.log(
        adminUser
          ? `👤 Admin user exists: ${adminUser.email}`
          : '⚠️ No admin user found. Run: npm run create-admin'
      );
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Please check your DATABASE_URL in .env file');
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
      console.log('   - *.netlify.app');
    });
  })();
}

module.exports = app;