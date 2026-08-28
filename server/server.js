// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
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
// ============== ADD ARTICLES ROUTE ==============
const articlesRoutes = require('./routes/articles.routes');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
}

// Ensure products subdirectory exists
const productsDir = path.join(uploadsDir, 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
  console.log('✅ Created products directory:', productsDir);
}

// Ensure settings subdirectory exists
const settingsDir = path.join(uploadsDir, 'settings');
if (!fs.existsSync(settingsDir)) {
  fs.mkdirSync(settingsDir, { recursive: true });
  console.log('✅ Created settings directory:', settingsDir);
}

// ============== ENSURE PDFS DIRECTORY EXISTS ==============
const pdfsDir = path.join(uploadsDir, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
  console.log('✅ Created PDFs directory:', pdfsDir);
}

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

// JSON parsing for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============== STATIC FILES ==============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products')));
app.use('/uploads/settings', express.static(path.join(__dirname, 'uploads/settings')));
app.use('/uploads/pdfs', express.static(path.join(__dirname, 'uploads/pdfs'))); // ADD THIS LINE

console.log('✅ Serving static files from:', path.join(__dirname, 'uploads'));

// ============== DATABASE CONNECTION ==============
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test the connection
    const userCount = await prisma.user.count();
    console.log(`📊 Database contains ${userCount} users`);
    
    // Check if admin exists
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
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

// ============== ROUTES ==============
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
// ============== ADD ARTICLES ROUTE ==============
app.use('/api/articles', articlesRoutes);

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      database: {
        connected: true,
        userCount: userCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Root route
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
      articles: '/api/articles', // ADD THIS LINE
      blog: '/api/blog',
      cart: '/api/cart',
      categories: '/api/categories',
      checkout: '/api/checkout',
      orders: '/api/orders',
      products: '/api/products',
      upload: '/api/upload',
      users: '/api/users',
      profile: '/api/profile',
      settings: '/api/admin/settings',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ Route not found:', req.method, req.url);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============== START SERVER ==============
async function startServer() {
  // Connect to database first
  const dbConnected = await connectDatabase();
  
  if (!dbConnected) {
    console.log('⚠️ Server starting without database connection. Some features may not work.');
  }
  
  // Start listening
  app.listen(PORT, () => {
    console.log('\n🌱 Genesis Agri Server running on http://localhost:' + PORT);
    console.log(' Uploads directory: ' + path.join(__dirname, 'uploads'));
    console.log(' Products directory: ' + path.join(__dirname, 'uploads/products'));
    console.log(' Settings directory: ' + path.join(__dirname, 'uploads/settings'));
    console.log(' PDFs directory: ' + path.join(__dirname, 'uploads/pdfs'));
    console.log(' Environment: ' + process.env.NODE_ENV);
    console.log('  Database: ' + (dbConnected ? 'Connected ✅' : 'Not Connected ⚠️'));
    console.log('');
    console.log('Available Endpoints:');
    console.log('   /api/auth         - Authentication routes');
    console.log('   /api/admin        - Admin routes');
    console.log('   /api/admin/dashboard - Dashboard routes');
    console.log('   /api/articles     - Article management routes'); // ADD THIS LINE
    console.log('   /api/blog         - Blog routes');
    console.log('   /api/cart         - Cart routes');
    console.log('   /api/categories   - Category routes');
    console.log('   /api/checkout     - Checkout routes');
    console.log('   /api/orders       - Order routes');
    console.log('   /api/products     - Product routes');
    console.log('   /api/upload       - Upload routes');
    console.log('   /api/users        - User routes');
    console.log('   /api/profile      - Profile routes');
    console.log('   /api/admin/settings - Settings routes');
    console.log('   /api/health       - Health check');
    console.log('');
    console.log('📄 Article Endpoints:');
    console.log('   POST   /api/articles        - Create article with PDF');
    console.log('   GET    /api/articles        - Get all articles');
    console.log('   GET    /api/articles/:id    - Get single article');
    console.log('   PUT    /api/articles/:id    - Update article');
    console.log('   DELETE /api/articles/:id    - Delete article');
    console.log('   PATCH  /api/articles/:id/status - Update article status');
    console.log('   GET    /api/articles/stats/summary - Get article statistics');
    console.log('   GET    /api/articles/search/query - Search articles');
    console.log('');
  });
}

// Handle graceful shutdown
async function gracefulShutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();

module.exports = app;