const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { setPending, getPending, deletePending } = require('../lib/pendingVerifications');

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

    res.json({ message: 'Verification code sent' });
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

    res.json({ message: 'Email verified successfully' });
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

    res.json({
      message: 'Account created successfully',
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Current User
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;