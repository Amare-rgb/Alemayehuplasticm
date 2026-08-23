const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'No authorization header provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token in authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    console.log('🔑 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified:', decoded);
    
    req.userId = decoded.id || decoded.userId;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// @route   GET /api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    console.log(`📊 Fetching profile for user ID: ${req.userId}`);
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        sellerProfile: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
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
      message: 'Server error: ' + error.message 
    });
  }
});

// @route   PUT /api/profile/update
// @desc    Update user profile
// @access  Private
router.put('/update', verifyToken, async (req, res) => {
  try {
    console.log(`📝 Updating profile for user ID: ${req.userId}`);
    console.log('📝 Update data:', req.body);

    const { name, phone } = req.body;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
      },
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
      message: 'Server error: ' + error.message 
    });
  }
});

// @route   PUT /api/profile/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide current and new password' 
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;