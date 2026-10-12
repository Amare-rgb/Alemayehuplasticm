// routes/profile.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

// ============================================================
// Middleware — verify JWT token
// ============================================================
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ No token in authorization header');
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    console.log('🔑 Verifying token...');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );
    console.log('✅ Token verified:', decoded);

    req.userId = decoded.id || decoded.userId;
    req.userRole = decoded.role || 'USER';
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// ============================================================
// GET /api/profile/me — current user profile
// ============================================================
router.get('/me', verifyToken, async (req, res) => {
  try {
    console.log(`📊 Fetching profile for user ID: ${req.userId}`);

    // ✅ No more sellerProfile include — the relation was removed
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('✅ User found:', user.email);
    console.log('📝 User name:', user.name);
    console.log('📝 User role:', user.role);

    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
});

// ============================================================
// PUT /api/profile/update — update user profile
// ============================================================
router.put('/update', verifyToken, async (req, res) => {
  try {
    console.log(`📝 Updating profile for user ID: ${req.userId}`);
    console.log('📝 Update data:', req.body);

    const { name, phone, address, bio, avatar } = req.body;

    // Build update payload — only include fields that were provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    // If nothing to update, return the current user
    if (Object.keys(updateData).length === 0) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const { password, ...userWithoutPassword } = currentUser;
      return res.json({
        success: true,
        message: 'No changes provided',
        user: userWithoutPassword,
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
    });

    console.log('✅ User updated:', updatedUser.email);
    console.log('📝 New name:', updatedUser.name);
    console.log('📝 New phone:', updatedUser.phone);

    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
});

// ============================================================
// PUT /api/profile/change-password
// ============================================================
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;