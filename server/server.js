// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ✅ Shared Prisma client (singleton) — no `new PrismaClient()` here.
//    lib/prisma.js should export a single instance used by all routes.
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════════════════════════
// TRUST PROXY (needed behind ngrok / nginx for correct protocol/ip)
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
// ✅ Telebirr payment routes (notify + return)
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
// CORS — supports multiple origins (dev + prod + ngrok)
// ═══════════════════════════════════════════════════════════
const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

const allowedOrigins = new Set(rawOrigins.map((o) => o.replace(/\/+$/, '')));

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, Postman) and same-origin requests
      if (!origin) return callback(null, true);
      const cleaned = origin.replace(/\/+$/, '');
      if (allowedOrigins.has(cleaned)) return callback(null, true);
      // Allow any ngrok subdomain in development for Telebirr testing
      if (
        process.env.NODE_ENV !== 'production' &&
        /\.ngrok(-free)?\.(io|app)$/.test(cleaned)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  })
);

// ═══════════════════════════════════════════════════════════
// BODY PARSERS
// ═══════════════════════════════════════════════════════════
// ✅ Raised limit so base64 payment proofs (images/PDF) are accepted.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ═══════════════════════════════════════════════════════════
// STATIC FILES
// ═══════════════════════════════════════════════════════════
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  })
);

app.use('/uploads/products', express.static(productsDir));
app.use('/uploads/settings', express.static(settingsDir));
app.use('/uploads/pdfs', express.static(pdfsDir));

console.log('✅ Serving static files from:', uploadsDir);
console.log('   - Products: /uploads/products');
console.log('   - Settings: /uploads/settings');
console.log('   - PDFs:     /uploads/pdfs');

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
// ✅ Telebirr payment routes (POST /notify + GET /return)
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
      database: {
        connected: true,
        userCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: {
        connected: false,
        error: error.message,
      },
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
    database: 'Connected',
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
      // ✅ Telebirr
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

  // Friendly response for oversized bodies (payment proofs)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payment proof file is too large. Please upload a file under 10 MB.',
    });
  }

  // CORS rejection
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({
      success: false,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ═══════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════
let server; // keep a reference for graceful shutdown

async function startServer() {
  const dbConnected = await connectDatabase();

  if (!dbConnected) {
    console.log('⚠️ Server starting without database connection. Some features may not work.');
  }

  server = http.createServer(app);
  server.listen(PORT, () => {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    console.log('\n🌱 Genesis Agri Server running on ' + backendUrl);
    console.log('📁 Uploads directory: ' + uploadsDir);
    console.log('📁 Products directory: ' + productsDir);
    console.log('📁 Settings directory: ' + settingsDir);
    console.log('📁 PDFs directory: ' + pdfsDir);
    console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('💾 Database: ' + (dbConnected ? 'Connected ✅' : 'Not Connected ⚠️'));
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log('   /api/auth             - Authentication routes');
    console.log('   /api/admin            - Admin routes');
    console.log('   /api/admin/dashboard  - Dashboard routes');
    console.log('   /api/articles         - Article management routes');
    console.log('   /api/blog             - Blog routes');
    console.log('   /api/cart             - Cart routes');
    console.log('   /api/categories       - Category routes');
    console.log('   /api/chatbot          - Chatbot routes');
    console.log('   /api/checkout         - Checkout routes');
    console.log('   /api/orders           - Order routes');
    console.log('   /api/products         - Product routes');
    console.log('   /api/upload           - Upload routes');
    console.log('   /api/users            - User routes');
    console.log('   /api/profile          - Profile routes');
    console.log('   /api/admin/settings   - Settings routes');
    console.log('   /api/health           - Health check');
    console.log('   /api/telebirr/notify  - Telebirr server-to-server webhook');
    console.log('   /api/telebirr/return  - Telebirr user return handler');
    console.log('');
    console.log('🔗 Telebirr URLs in use:');
    console.log('   notify_url   : ' + (process.env.TELEBIRR_NOTIFY_URL || `${backendUrl}/api/telebirr/notify`));
    console.log('   redirect_url : ' + (process.env.TELEBIRR_REDIRECT_URL || `${backendUrl}/api/telebirr/return`));
    console.log('');
  });
}

// ═══════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════
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

// Start the server
startServer();

module.exports = app;