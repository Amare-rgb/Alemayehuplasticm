// routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { setPending, getPending, deletePending } = require('../lib/pendingVerifications');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'USER', shopName } = req.body;

    const RESERVED_ACCOUNTS = [
      'adminpa@gmail.com',
      'selerpa@gmail.com',
      'admin@shophub.com',
      'seller@shophub.com',
    ];

    if (RESERVED_ACCOUNTS.includes(email.toLowerCase())) {
      return res.status(403).json({
        error: 'This email is reserved. Please contact an administrator or use the provided login credentials.'
      });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(password, 12);

    setPending(email, {
      email,
      name,
      role,
      shopName: shopName || null,
      password: hashed,
      otp,
      createdAt: Date.now(),
      verified: false,
    });

    // In production, send verification email here
    console.log(`📧 Verification OTP for ${email}: ${otp}`);

    res.json({ 
      success: true,
      message: 'Verification code sent',
      email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const pending = getPending(email);

    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found' });
    }

    if (pending.otp !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    pending.verified = true;
    setPending(email, pending);

    res.json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Complete Registration
router.post('/complete-registration', async (req, res) => {
  try {
    const { email } = req.body;
    const pending = getPending(email);

    if (!pending || !pending.verified) {
      return res.status(400).json({
        error: 'Email not verified. Please verify your email first.'
      });
    }

    const user = await prisma.user.create({
      data: {
        name: pending.name,
        email: pending.email,
        password: pending.password,
        role: pending.role,
        ...(pending.role === 'SELLER' && pending.shopName
          ? {
              sellerProfile: {
                create: {
                  shopName: pending.shopName,
                },
              },
            }
          : {}),
      },
    });

    deletePending(email);

    // Generate token for auto-login
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login - FIXED VERSION
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email); // Debug log

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    console.log('📊 User found:', user ? 'Yes' : 'No'); // Debug log

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Check if user has password (some OAuth users might not)
    if (!user.password) {
      return res.status(401).json({ 
        success: false,
        error: 'Account created with OAuth. Please use Google login.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Password valid:', isValidPassword); // Debug log

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed' 
    });
  }
});

// Get Current User - FIXED VERSION
router.get('/me', requireAuth, async (req, res) => {
  try {
    // req.user is set by the requireAuth middleware
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

module.exports = router;