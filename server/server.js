// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
const webhookRoutes = require('./routes/webhooks.routes');
const usersRoutes = require('./routes/users.routes');
const settingsRoutes = require('./routes/settings.routes');
const profileRoutes = require('./routes/profile.routes');
const sellerRoutes = require('./routes/seller.routes'); // ✅ ADD SELLER ROUTES

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

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Raw body parsing for Stripe webhooks
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============== STATIC FILES ==============
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('✅ Serving static files from:', path.join(__dirname, 'uploads'));

// Also serve from root uploads path for compatibility
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads/products')));
app.use('/uploads/settings', express.static(path.join(__dirname, 'uploads/settings')));

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
app.use('/api/webhooks/stripe', webhookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/seller', sellerRoutes); // ✅ ADD SELLER ROUTES HERE

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Genesis Agri API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      adminDashboard: '/api/admin/dashboard',
      blog: '/api/blog',
      cart: '/api/cart',
      categories: '/api/categories',
      checkout: '/api/checkout',
      orders: '/api/orders',
      products: '/api/products',
      upload: '/api/upload',
      users: '/api/users',
      profile: '/api/profile',
      seller: '/api/seller', // ✅ ADD SELLER ENDPOINT
      settings: '/api/admin/settings',
      webhooks: '/api/webhooks/stripe',
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

// Error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('Genesis Agri Server running on http://localhost:' + PORT);
  console.log('Uploads directory: ' + path.join(__dirname, 'uploads'));
  console.log('Products directory: ' + path.join(__dirname, 'uploads/products'));
  console.log('Settings directory: ' + path.join(__dirname, 'uploads/settings'));
  console.log('Environment: ' + process.env.NODE_ENV);
  console.log('Health check: http://localhost:' + PORT + '/api/health');
  console.log('Dashboard endpoint: http://localhost:' + PORT + '/api/admin/dashboard');
  console.log('Users endpoint: http://localhost:' + PORT + '/api/users');
  console.log('Profile endpoint: http://localhost:' + PORT + '/api/profile');
  console.log('Seller endpoint: http://localhost:' + PORT + '/api/seller');
  console.log(' Settings endpoint: http://localhost:' + PORT + '/api/admin/settings');
  console.log('Test image URL: http://localhost:' + PORT + '/uploads/products/');
  console.log('');
  console.log(' All routes loaded successfully!');
  console.log(' Available seller routes:');
  console.log('   POST   /api/seller/register - Register as seller');
  console.log('   GET    /api/seller/profile - Get seller profile');
  console.log('   PUT    /api/seller/profile - Update seller profile');
  console.log('   POST   /api/seller/products - Create product');
  console.log('   GET    /api/seller/products - Get seller products');
  console.log('   PUT    /api/seller/products/:id - Update product');
  console.log('   DELETE /api/seller/products/:id - Delete product');
  console.log('   GET    /api/seller/stats - Get seller statistics');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;