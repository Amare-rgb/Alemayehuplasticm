// middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Authentication middleware - checks if user is logged in
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔑 Decoded token:', decoded);
    
    // Get user ID from token - handle both formats
    const userId = decoded.userId || decoded.id || decoded.user_id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token: No user ID found',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Set user in request
    req.user = {
      id: userId,
      userId: userId,
      email: decoded.email,
      role: decoded.role || 'USER',
      name: decoded.name || decoded.userName || '',
      ...decoded
    };
    
    // Also set in session for compatibility
    req.session = req.session || {};
    req.session.user = {
      id: userId,
      userId: userId,
      email: decoded.email,
      role: decoded.role || 'USER',
      name: decoded.name || decoded.userName || ''
    };

    console.log('✅ User authenticated:', req.user.email, 'Role:', req.user.role);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.error('❌ JWT Error:', error.message);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      console.error('❌ Token Expired');
      return res.status(401).json({ 
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  // First authenticate
  requireAuth(req, res, () => {
    const userRole = req.user?.role?.toUpperCase();
    console.log('🛡️ Admin check - User role:', userRole);
    
    if (userRole !== 'ADMIN') {
      console.log('❌ Admin access denied for role:', userRole);
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }
    console.log('✅ Admin access granted');
    next();
  });
};

// Seller authorization middleware
const requireSeller = (req, res, next) => {
  requireAuth(req, res, () => {
    const userRole = req.user?.role?.toUpperCase();
    if (userRole !== 'SELLER' && userRole !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Seller access required',
        code: 'SELLER_REQUIRED'
      });
    }
    next();
  });
};

// Seller or Admin authorization middleware
const requireSellerOrAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    const userRole = req.user?.role?.toUpperCase();
    if (userRole !== 'SELLER' && userRole !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Seller or Admin access required',
        code: 'SELLER_OR_ADMIN_REQUIRED'
      });
    }
    next();
  });
};

// Alias for requireAuth
const authenticateToken = requireAuth;

const isAdmin = (req, res, next) => {
  const userRole = req.user?.role?.toUpperCase();
  if (!req.user || userRole !== 'ADMIN') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireSeller,
  requireSellerOrAdmin,
  authenticateToken,
  isAdmin
};