// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

// ✅ Shared Prisma client (singleton) — connects to Neon
const prisma = require('./lib/prisma');

// ✅ Cloudinary (for image storage)
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ═══════════════════════════════════════════════════════════
// CLOUDINARY CONFIG
// ═══════════════════════════════════════════════════════════
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// ═══════════════════════════════════════════════════════════
// PLATFORM DETECTION
// ═══════════════════════════════════════════════════════════
const isNetlify = !!(process.env.NETLIFY || process.env.NETLIFY_LOCAL);
const isVercel = !!process.env.VERCEL;
const isRailway = !!(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_PROJECT_ID ||
  process.env.RAILWAY_PUBLIC_DOMAIN
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
// TRUST PROXY — Railway sits behind a proxy
// ═══════════════════════════════════════════════════════════
app.set('trust proxy', 1);

// ═══════════════════════════════════════════════════════════
// HARD-CODED PRODUCTION ORIGINS (safety net — always allowed)
// ═══════════════════════════════════════════════════════════
const PRODUCTION_FRONTEND_ORIGINS = [
  'https://alemayehuplasticm.vercel.app',
];

const PRODUCTION_BACKEND_ORIGINS = [
  'https://alemayehuplasticm-production.up.railway.app',
];

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
// CORS — MUST come before all routes
// ═══════════════════════════════════════════════════════════
const stripSlash = (o) => String(o).trim().replace(/\/+$/, '');

const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = new Set(
  [
    // ✅ Your real production frontend (always allowed)
    ...PRODUCTION_FRONTEND_ORIGINS,

    // ✅ Your own backend origin (useful for same-origin/server calls)
    ...PRODUCTION_BACKEND_ORIGINS,

    // Env-driven (Railway service variables)
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VITE_API_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,

    // Local dev
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite default
    'http://localhost:5174',
    'http://localhost:8888',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',

    ...extraOrigins,
  ]
    .filter(Boolean)
    .map(stripSlash)
);

// Regex fallbacks (all Vercel / Railway preview URLs accepted)
const VERCEL_REGEX   = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i;
const NETLIFY_REGEX  = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.netlify\.app$/i;
const RAILWAY_REGEX  = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.up\.railway\.app$/i;
const NGROK_REGEX    = /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.ngrok(-free)?\.(io|app|dev)$/i;
const LAN_REGEX      = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

function isOriginAllowed(origin) {
  // No origin → curl / Postman / server-to-server → allow
  if (!origin) return true;

  const cleaned = stripSlash(origin);

  // Explicit allowlist
  if (allowedOrigins.has(cleaned)) return true;

  // Regex allowlists
  if (VERCEL_REGEX.test(cleaned))  return true;
  if (NETLIFY_REGEX.test(cleaned)) return true;
  if (RAILWAY_REGEX.test(cleaned)) return true;

  // Dev-only extra allowlists
  if (!isProd) {
    if (NGROK_REGEX.test(cleaned)) return true;
    if (LAN_REGEX.test(cleaned))   return true;
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);

    console.warn(`⚠️ CORS blocked for origin: ${origin}`);
    // Return `false` (not an Error) → preflight still resolves, browser blocks
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'ngrok-skip-browser-warning',
    'Cache-Control',
    'Pragma',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // cache preflight for 24h
  preflightContinue: false,
};

// Apply CORS to every request
app.use(cors(corsOptions));

// Explicit OPTIONS handler — bulletproofs preflight behind Railway's proxy
app.options('*', cors(corsOptions));

// Also handle bare OPTIONS on root & /api (some proxies rewrite paths)
app.options('/', cors(corsOptions));
app.options('/api', cors(corsOptions));

// ═══════════════════════════════════════════════════════════
// BODY PARSERS
// ═══════════════════════════════════════════════════════════
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ═══════════════════════════════════════════════════════════
// IMPORT ROUTES
// ═══════════════════════════════════════════════════════════
const authRoutes            = require('./routes/auth.routes');
const adminRoutes           = require('./routes/admin.routes');
const adminDashboardRoutes  = require('./routes/admin.dashboard');
const categoriesRoutes      = require('./routes/categories.routes');
const productsRoutes        = require('./routes/products.routes');
const uploadRoutes          = require('./routes/upload.routes');
const usersRoutes           = require('./routes/users.routes');
const settingsRoutes        = require('./routes/settings.routes');
const profileRoutes         = require('./routes/profile.routes');
const chatbotRoutes         = require('./routes/chatbot.routes');

// ═══════════════════════════════════════════════════════════
// API ROUTER
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
apiRouter.use('/chatbot', chatbotRoutes);

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
      storage: cloudinaryConfigured ? 'cloudinary' : 'not-configured',
      database: {
        connected: true,
        provider: 'neon',
        userCount,
      },
      services: {
        chatbot: process.env.OPENROUTER_API_KEY ? 'enabled' : 'disabled',
        cloudinary: cloudinaryConfigured ? 'enabled' : 'disabled',
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
    storage: cloudinaryConfigured ? 'cloudinary' : 'not-configured',
    database: 'neon-postgresql',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      adminDashboard: '/api/admin/dashboard',
      categories: '/api/categories',
      chatbot: '/api/chatbot',
      products: '/api/products',
      upload: '/api/upload',
      users: '/api/users',
      profile: '/api/profile',
      settings: '/api/admin/settings',
      health: '/api/health',
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
      error: 'File is too large. Please upload a file under 10 MB.',
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
      error: 'File too large. Max 10 MB.',
    });
  }

  if (err.message && err.message.toLowerCase().includes('cors')) {
    return res.status(403).json({
      success: false,
      error: 'CORS policy blocked this request.',
      origin: req.headers.origin,
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
      console.log(`✅ Neon database connected (${userCount} users)`);

      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      console.log(
        adminUser
          ? `👤 Admin user exists: ${adminUser.email}`
          : '⚠️ No admin user found. Run: npx prisma db seed'
      );
    } catch (error) {
      console.error('❌ Neon database connection failed:', error.message);
      console.error('Please check your DATABASE_URL in .env');
    }

    server = http.createServer(app);
    server.keepAliveTimeout = 65 * 1000;
    server.headersTimeout = 66 * 1000;

    // ✅ Listen on 0.0.0.0 so Railway's router can reach the container
    server.listen(PORT, '0.0.0.0', () => {
      const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : null;
      const backendUrl =
        railwayUrl ||
        process.env.BACKEND_URL ||
        `http://localhost:${PORT}`;

      console.log('\n🏭 Alemayehu Plastic Server running on ' + backendUrl);
      console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
      console.log('🚆 Platform: ' + platformName);
      console.log(
        '📁 Storage: ' +
          (cloudinaryConfigured ? 'Cloudinary ✅' : 'Not configured ⚠️')
      );
      console.log('💾 Database: ' + (dbConnected ? 'Neon Connected ✅' : 'Not Connected ⚠️'));
      console.log(
        '🤖 Chatbot: ' +
          (process.env.OPENROUTER_API_KEY
            ? 'OpenRouter AI enabled ✅'
            : 'Fallback mode ⚠️')
      );
      console.log('🔓 Allowed origins:');
      allowedOrigins.forEach((o) => console.log('   • ' + o));
    });

    // Neon keep-alive (prevents cold-start timeouts)
    const keepAliveMs =
      process.env.DB_KEEPALIVE_MS !== undefined
        ? Number(process.env.DB_KEEPALIVE_MS)
        : 4 * 60 * 1000;

    if (keepAliveMs > 0) {
      keepAliveTimer = setInterval(async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
        } catch (err) {
          console.warn('⚠️ Neon keep-alive ping failed:', err.message);
        }
      }, keepAliveMs);
      keepAliveTimer.unref();
    }
  })();
}

module.exports = app;