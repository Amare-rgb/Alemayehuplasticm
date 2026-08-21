// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Authentication middleware - checks if user is logged in
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.session = { user: decoded };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication error' 
    });
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  // First, authenticate the user
  requireAuth(req, res, () => {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required' 
      });
    }
    next();
  });
};

// Seller authorization middleware
const requireSeller = (req, res, next) => {
  // First, authenticate the user
  requireAuth(req, res, () => {
    // Check if user is seller or admin
    if (req.user.role !== 'SELLER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Seller access required' 
      });
    }
    next();
  });
};

// Seller or Admin authorization middleware
const requireSellerOrAdmin = (req, res, next) => {
  // First, authenticate the user
  requireAuth(req, res, () => {
    // Check if user is seller or admin
    if (req.user.role !== 'SELLER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Seller or Admin access required' 
      });
    }
    next();
  });
};

// Alias for requireAuth (for backward compatibility)
const authenticateToken = requireAuth;
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
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