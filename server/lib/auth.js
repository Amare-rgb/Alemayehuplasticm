const jwt = require('jsonwebtoken');
const prisma = require('./prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get server session from JWT token
const getServerSession = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    return null;
  }
};

// Generate JWT token for login
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate email verification token (for email verification link)
const generateVerificationToken = (email) => {
  return jwt.sign(
    { 
      email, 
      purpose: 'email-verification' 
    },
    JWT_SECRET,
    { expiresIn: '24h' } // 24 hours expiry
  );
};

// Verify email verification token
const verifyVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's a verification token
    if (decoded.purpose !== 'email-verification') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

// Generate password reset token
const generateResetToken = (email) => {
  return jwt.sign(
    { 
      email, 
      purpose: 'password-reset' 
    },
    JWT_SECRET,
    { expiresIn: '1h' } // 1 hour expiry
  );
};

// Verify password reset token
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.purpose !== 'password-reset') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  getServerSession,
  generateToken,
  generateVerificationToken,
  verifyVerificationToken,
  generateResetToken,
  verifyResetToken,
  JWT_SECRET
};