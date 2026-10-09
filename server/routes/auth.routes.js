// routes/auth.routes.js
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateToken } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../lib/email');

// ============================================
// HELPERS & CONSTANTS
// ============================================

// ✅ 10 rounds is the standard balance of security and speed.
// 12+ is very slow on small Railway CPUs with bcryptjs (pure JS).
// Existing hashes keep working because the cost is stored inside each hash.
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

// ✅ Roles a visitor may pick for themselves at registration.
// NEVER include 'ADMIN' here. Add other roles (e.g. 'SELLER') only if
// your Prisma Role enum has them and they should be self-service.
const SELF_SERVICE_ROLES = ['USER'];

const RESERVED_ACCOUNTS = ['adminpa@gmail.com'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Safe against non-string input (numbers, objects) that would crash .toLowerCase()
const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

// Matches the rules shown on the register form:
// at least 8 characters and at least one number.
const passwordError = (pw) => {
  if (typeof pw !== 'string' || pw.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (pw.length > 128) {
    return 'Password is too long (maximum 128 characters)';
  }
  if (!/\d/.test(pw)) {
    return 'Password must contain at least one number';
  }
  return null;
};

// ✅ Run slow side-jobs (like email) AFTER the response is sent.
// Errors are logged but never block or fail the request.
const runInBackground = (label, fn) => {
  Promise.resolve()
    .then(fn)
    .catch((err) =>
      console.error(`⚠️  ${label} failed:`, err && err.message ? err.message : err)
    );
};

// Timing-safe string comparison (for secret keys)
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// ============================================
// REGISTER — creates the user, sends welcome email in the background
// POST /api/auth/register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { name, password, phone, role } = req.body || {};
    const email = normalizeEmail(req.body && req.body.email);
    const cleanName = typeof name === 'string' ? name.trim() : '';

    if (!cleanName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address',
      });
    }

    const pwErr = passwordError(password);
    if (pwErr) {
      return res.status(400).json({ success: false, error: pwErr });
    }

    if (RESERVED_ACCOUNTS.includes(email)) {
      return res.status(403).json({
        success: false,
        error: 'This email is reserved. Please contact an administrator.',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // ✅ SECURITY: never trust the role sent by the browser.
    // Before, anyone could register with role "ADMIN".
    const requestedRole = String(role || 'USER').toUpperCase();
    const finalRole = SELF_SERVICE_ROLES.includes(requestedRole)
      ? requestedRole
      : 'USER';

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email,
        password: hashedPassword,
        phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
        role: finalRole,
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

    // ✅ FIX: do NOT await the email.
    // On Railway, SMTP connections time out (~120s), which made
    // register hang. Now the user gets a response immediately and the
    // email is attempted in the background.
    runInBackground('Welcome email', () =>
      sendWelcomeEmail(user.email, user.name)
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user,
    });
  } catch (error) {
    // Two requests registering the same email at the same moment
    if (error && error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
    }

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
    const email = normalizeEmail(req.body && req.body.email);
    const password = req.body && req.body.password;

    if (!email || !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // ✅ Fast indexed lookup first (new users are stored lowercase).
    // Fall back to a case-insensitive search for older accounts.
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
    }

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
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    const pwErr = passwordError(newPassword);
    if (pwErr) {
      return res.status(400).json({ success: false, error: pwErr });
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

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
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
    const { name, phone, address, bio, avatar } = req.body || {};

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
    const email = normalizeEmail(req.body && req.body.email);
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

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
//
// ⚠️ SECURITY WARNING: this route has NO proof that the caller owns the
// email (no emailed token). Anyone who knows an email can change that
// account's password. Replace it with a token-based flow as soon as email
// sending works (see notes). As a minimum protection, ADMIN accounts
// cannot be reset through this route.
// ============================================
router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    const newPassword = req.body && req.body.newPassword;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required',
      });
    }

    const pwErr = passwordError(newPassword);
    if (pwErr) {
      return res.status(400).json({ success: false, error: pwErr });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin passwords must be reset by a system administrator.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
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
//
// ✅ SECURITY: this route used to be open to everyone. It now requires
// the header  x-admin-setup-key  to equal the ADMIN_SETUP_KEY variable.
// If ADMIN_SETUP_KEY is not set in Railway, the route is disabled.
// (You can also keep using:  npm run create-admin)
// ============================================
router.post('/create-admin', async (req, res) => {
  try {
    const setupKey = process.env.ADMIN_SETUP_KEY;

    if (!setupKey || !safeEqual(req.get('x-admin-setup-key'), setupKey)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      });
    }

    const { password, name = 'Admin User' } = req.body || {};
    const email = normalizeEmail(req.body && req.body.email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const pwErr = passwordError(password);
    if (pwErr) {
      return res.status(400).json({ success: false, error: pwErr });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email,
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