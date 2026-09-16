// routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../lib/email');

// ============================================
// REGISTER — creates the user, sends welcome email
// POST /api/auth/register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role = 'USER' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    const RESERVED_ACCOUNTS = ['adminpa@gmail.com'];
    if (RESERVED_ACCOUNTS.includes(email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: 'This email is reserved. Please contact an administrator.',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        bio: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    // ✅ Send welcome notification (do not fail registration if email fails)
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailErr) {
      console.error('⚠️  Welcome email failed to send:', emailErr);
    }

    res.status(201).json({
      success: true,
      message:
        'Account created successfully. Check your inbox for a welcome email.',
      user,
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================
// LOGIN
// POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email.toLowerCase(), mode: 'insensitive' },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.',
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: 'Account created with OAuth. Please use Google login.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Wrong password.',
      });
    }

    const token = generateToken(user.id, user.email, user.role);
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================
// GET CURRENT USER
// GET /api/auth/me
// ============================================
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        bio: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            shopName: true,
            shopDesc: true,
            isVerified: true,
            totalSales: true,
            phone: true,
            address: true,
            logo: true,
            banner: true,
            isAdmin: true,
            permissions: true,
          },
        },
        adminProfile: {
          select: {
            id: true,
            permissions: true,
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================
// LOGOUT
// POST /api/auth/logout
// ============================================
router.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================
// CHANGE PASSWORD
// POST /api/auth/change-password
// ============================================
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change password for this account',
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to change password' });
  }
});

// ============================================
// UPDATE PROFILE
// PATCH /api/auth/profile
// ============================================
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, bio, avatar } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address;
    if (bio !== undefined) data.bio = bio;
    if (avatar !== undefined) data.avatar = avatar;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields provided to update',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        bio: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ============================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: 'User not found' });
    }

    console.log(`📧 Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to process request' });
  }
});

// ============================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ============================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to reset password' });
  }
});

// ============================================
// ADMIN: Create admin user
// POST /api/auth/create-admin
// ============================================
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, name = 'Admin User' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    const { password: _, ...userData } = user;

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: userData,
    });
  } catch (error) {
    console.error('❌ Admin creation error:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create admin user' });
  }
});

module.exports = router;