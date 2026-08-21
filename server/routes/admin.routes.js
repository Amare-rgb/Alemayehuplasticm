const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Get all users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          }
        }
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.patch('/users', requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, totalCategories] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.category.count()
    ]);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalCategories
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create seller (with documents)
router.post('/sellers', requireAdmin, uploadDocuments, async (req, res) => {
  try {
    const { business, bank } = req.body;
    const businessData = business ? JSON.parse(business) : {};
    const bankData = bank ? JSON.parse(bank) : {};

    const documents = req.files ? req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype
    })) : [];

    // Mock seller creation (replace with actual Prisma create)
    const seller = {
      id: 'mock-seller-' + Date.now(),
      business: businessData,
      bank: bankData,
      documents,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({ ok: true, seller });
  } catch (error) {
    console.error('Error creating seller:', error);
    res.status(500).json({ error: 'Failed to create seller' });
  }
});

module.exports = router;