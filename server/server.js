// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');

// ✅ Shared Prisma client (singleton)
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ✅ Detect serverless platforms
const isNetlify = !!(process.env.NETLIFY || process.env.NETLIFY_LOCAL);
const isVercel = !!process.env.VERCEL;
const isRailway = !!(
  process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID
);
const isServerless =
  isNetlify || isVercel || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const platformName = isNetlify
  ? 'netlify'
  : isVercel
  ? 'vercel'
  : isRailway
  ? 'railway'
  : 'node';

// ═══════════════════════════════════════════════════════════
// TRUST PROXY
// ═══════════════════════════════════════════════════════════
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════
// LOCAL UPLOAD DIRECTORIES — CREATE IF MISSING
// ═══════════════════════════════════════════════════════════
const UPLOAD_ROOT = path.join(__dirname, 'uploads');
const UPLOAD_DIRS = [
  UPLOAD_ROOT,
  path.join(UPLOAD_ROOT, 'products'),
  path.join(UPLOAD_ROOT, 'categories'),
  path.join(UPLOAD_ROOT, 'avatars'),
  path.join(UPLOAD_ROOT, 'articles'),
];

function ensureUploadDirs() {
  for (const dir of UPLOAD_DIRS) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created upload dir: ${dir}`);
    }
  }
}
ensureUploadDirs();

// ═══════════════════════════════════════════════════════════
// Collapse double slashes in the URL PATH
// ═══════════════════════════════════════════════════════════
app.use((req, res, next) => {
  const i = req.url.indexOf('?');
  const p = i === -1 ? req.url : req.url.slice(0, i);
  const query = i === -1 ? '' : req.url.slice(i);
  if (p.includes('//')) {
    req.url = p.replace(/\/{2,}/g, '/') + query;
  }
  next();
});

// ═══════════════════════════════════════════════════════════
// Slow request logger
// ═══════════════════════════════════════════════════════════
const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS) || 2000;

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms >= SLOW_REQUEST_MS) {
      console.warn(
        `🐢 Slow request: ${req.method} ${req.originalUrl} → ${res.statusCode} in ${ms}ms`
      );
    }
  });
  next();
});

// ═══════════════════════════════════════════════════════════
// IMPORT ROUTES
// ═══════════════════════════════════════════════════════════
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const adminDashboardRoutes = require('./routes/admin.dashboard');
const categoriesRoutes = require('./routes/categories.routes');
const productsRoutes = require('./routes/products.routes');
const uploadRoutes = require('./routes/upload.routes');
const usersRoutes = require('./routes/users.routes');
const settingsRoutes = require('./routes/settings.routes');
const profileRoutes = require('./routes/profile.routes');
const chatbotRoutes = require('./routes/chatbot.routes'); // ✅ RE-ENABLED (OpenRouter AI)

// ═══════════════════════════════════════════════════════════
// CORS
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
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8888',
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
  if (!origin) return true;
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
// ═══════════════════════════════════════════════════════════
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ═══════════════════════════════════════════════════════════
// LOCAL STATIC FILES — serve /uploads/** from disk
// ═══════════════════════════════════════════════════════════
app.use(
  '/uploads',
  express.static(UPLOAD_ROOT, {
    maxAge: isProd ? '7d' : 0,
    etag: true,
    index: false,
  })
);

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin/dashboard', adminDashboardRoutes);
apiRouter.use('/admin/settings', settingsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/products', productsRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/chatbot', chatbotRoutes); // ✅ RE-ENABLED (OpenRouter AI)

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════
const healthHandler = async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: platformName,
      storage: 'local-disk',
      database: { connected: true, userCount },
      services: {
        chatbot: process.env.OPENROUTER_API_KEY ? 'enabled' : 'disabled',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: { connected: false, error: error.message },
    });
  }
};

apiRouter.get('/health', healthHandler);

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.use('/api', apiRouter);

// ═══════════════════════════════════════════════════════════
// ROOT ROUTE
// ═══════════════════════════════════════════════════════════
const rootInfo = (req, res) => {
  res.json({
    name: 'Alemayehu Plastic Manufacturing API Server',
    version: '1.0.0',
    status: 'Running',
    platform: platformName,
    storage: 'local-disk',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      adminDashboard: '/api/admin/dashboard',
      categories: '/api/categories',
      chatbot: '/api/chatbot', // ✅ RE-ENABLED
      products: '/api/products',
      upload: '/api/upload',
      users: '/api/users',
      profile: '/api/profile',
      settings: '/api/admin/settings',
      health: '/api/health',
      uploads: '/uploads/*',
    },
  });
};
app.get('/', rootInfo);
app.get('/api', rootInfo);

// ═══════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════
app.use((req, res) => {
  console.log('❌ Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    path: req.originalUrl,
    method: req.method,
  });
});

// ═══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);

  if (res.headersSent) return next(err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'File is too large. Please upload a file under 5 MB.',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body.',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Max 5 MB.',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ═══════════════════════════════════════════════════════════
// PROCESS-LEVEL SAFETY NETS
// ═══════════════════════════════════════════════════════════
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

// ═══════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════
if (!isServerless) {
  let server;
  let keepAliveTimer;

  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    try {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
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
          : '⚠️ No admin user found. Run: node prisma/seed.js'
      );
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Please check your DATABASE_URL in .env');
    }

    server = http.createServer(app);
    server.keepAliveTimeout = 65 * 1000;
    server.headersTimeout = 66 * 1000;

    server.listen(PORT, '0.0.0.0', () => {
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
      console.log('\n🏭 Alemayehu Plastic Server running on ' + backendUrl);
      console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
      console.log('🚆 Platform: ' + platformName);
      console.log('📁 Storage: Local disk (/uploads)');
      console.log('💾 Database: ' + (dbConnected ? 'Connected ✅' : 'Not Connected ⚠️'));
      console.log(
        '🤖 Chatbot: ' +
          (process.env.OPENROUTER_API_KEY ? 'OpenRouter AI enabled ✅' : 'Fallback mode ⚠️')
      );
    });

    const keepAliveMs =
      process.env.DB_KEEPALIVE_MS !== undefined
        ? Number(process.env.DB_KEEPALIVE_MS)
        : 4 * 60 * 1000;

    if (keepAliveMs > 0) {
      keepAliveTimer = setInterval(async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
        } catch (err) {
          console.warn('⚠️ DB keep-alive ping failed:', err.message);
        }
      }, keepAliveMs);
      keepAliveTimer.unref();
    }
  })();
}

module.exports = app;